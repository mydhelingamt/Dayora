package com.dayora

import android.app.Activity
import android.content.ComponentCallbacks2
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Matrix
import android.media.ExifInterface
import android.net.Uri
import android.os.Build
import android.os.Environment
import android.provider.MediaStore
import androidx.core.content.FileProvider
import com.facebook.react.bridge.*
import java.io.*
import java.security.MessageDigest

class DayoraStorageModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "DayoraStorageModule"

    private var importPromise: Promise? = null
    private val IMPORT_REQUEST_CODE = 42109

    private val activityEventListener: ActivityEventListener = object : BaseActivityEventListener() {
        override fun onActivityResult(activity: Activity, requestCode: Int, resultCode: Int, data: Intent?) {
            if (requestCode == IMPORT_REQUEST_CODE) {
                val p = importPromise
                importPromise = null
                if (resultCode == Activity.RESULT_OK && data?.data != null) {
                    val uri = data.data!!
                    Thread {
                        try {
                            val text = reactContext.contentResolver.openInputStream(uri)?.use { stream ->
                                stream.bufferedReader(Charsets.UTF_8).use { it.readText() }
                            }
                            if (!text.isNullOrBlank()) {
                                p?.resolve(text)
                            } else {
                                p?.reject("EMPTY_BACKUP", "The selected file is empty.")
                            }
                        } catch (e: Throwable) {
                            p?.reject("READ_FAILED", "Failed to read selected file: ${e.message}", e)
                        }
                    }.start()
                } else {
                    p?.reject("CANCELLED", "Import cancelled by user.")
                }
            }
        }
    }

    init {
        reactContext.addActivityEventListener(activityEventListener)
    }

    private val mediaDir: File
        get() = File(reactContext.filesDir, "media").apply { if (!exists()) mkdirs() }

    private val thumbsDir: File
        get() = File(reactContext.filesDir, "thumbnails").apply { if (!exists()) mkdirs() }

    private val tempMediaDir: File
        get() = File(reactContext.cacheDir, "temp_media").apply { if (!exists()) mkdirs() }

    @ReactMethod
    fun processAndStoreImage(
        sourceUriString: String,
        entityType: String,
        entityId: String,
        promise: Promise
    ) {
        Thread {
            var tempInputFile: File? = null
            try {
                val sourceUri = Uri.parse(sourceUriString)
                val isContent = sourceUri.scheme == "content"
                
                // Copy stream to a temporary processing file if from content resolver or remote
                val inputFile: File = if (isContent) {
                    tempInputFile = File(tempMediaDir, "proc_${System.currentTimeMillis()}.tmp")
                    reactContext.contentResolver.openInputStream(sourceUri)?.use { input ->
                        FileOutputStream(tempInputFile).use { output ->
                            input.copyTo(output)
                        }
                    } ?: throw IOException("Unable to open stream for content URI: $sourceUriString")
                    tempInputFile
                } else {
                    val path = sourceUri.path ?: sourceUriString
                    File(path)
                }

                if (!inputFile.exists() || inputFile.length() == 0L) {
                    throw FileNotFoundException("Source image file does not exist or is empty: $sourceUriString")
                }

                // 1. Calculate SHA-256 hash for deduplication
                val hash = calculateSha256(inputFile)
                val targetFullFile = File(mediaDir, "$hash.jpg")
                val targetThumbFile = File(thumbsDir, "${hash}_thumb.jpg")

                // 2. Check if identical image is already stored
                if (targetFullFile.exists() && targetThumbFile.exists() && targetFullFile.length() > 0L) {
                    // Extract existing dimensions quickly
                    val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                    BitmapFactory.decodeFile(targetFullFile.absolutePath, boundsOpts)

                    val result = Arguments.createMap().apply {
                        putString("photoUri", Uri.fromFile(targetFullFile).toString())
                        putString("thumbnailUri", Uri.fromFile(targetThumbFile).toString())
                        putInt("width", boundsOpts.outWidth)
                        putInt("height", boundsOpts.outHeight)
                        putDouble("fileSizeBytes", targetFullFile.length().toDouble())
                        putString("hash", hash)
                        putBoolean("isDuplicate", true)
                    }

                    // Clean up source if it was inside cache
                    cleanSourceIfInCache(inputFile)
                    promise.resolve(result)
                    return@Thread
                }

                // 3. Inspect image bounds and EXIF orientation
                val orientation = getExifOrientation(inputFile)
                val boundsOpts = BitmapFactory.Options().apply { inJustDecodeBounds = true }
                BitmapFactory.decodeFile(inputFile.absolutePath, boundsOpts)

                val origWidth = boundsOpts.outWidth
                val origHeight = boundsOpts.outHeight

                if (origWidth <= 0 || origHeight <= 0) {
                    throw IOException("Invalid image dimensions: ${origWidth}x${origHeight}")
                }

                // 4. Downscale and decode full-resolution photo (Max 512x512)
                val maxFullDim = 512
                val sampleSize = calculateInSampleSize(origWidth, origHeight, maxFullDim, maxFullDim)
                val decodeOpts = BitmapFactory.Options().apply {
                    inSampleSize = sampleSize
                    inPreferredConfig = Bitmap.Config.ARGB_8888
                }

                val sampledBitmap = BitmapFactory.decodeFile(inputFile.absolutePath, decodeOpts)
                    ?: throw IOException("Failed to decode image from: ${inputFile.absolutePath}")

                // Correct EXIF orientation
                val orientedBitmap = applyExifOrientation(sampledBitmap, orientation)
                if (orientedBitmap != sampledBitmap) {
                    sampledBitmap.recycle()
                }

                // Scale to exact max 512 boundary while maintaining aspect ratio
                val finalFullBitmap = scalePreservingAspect(orientedBitmap, maxFullDim)
                if (finalFullBitmap != orientedBitmap) {
                    orientedBitmap.recycle()
                }

                // Save persistent full photo (JPEG 80%)
                FileOutputStream(targetFullFile).use { out ->
                    finalFullBitmap.compress(Bitmap.CompressFormat.JPEG, 80, out)
                    out.flush()
                }

                // 5. Generate lightweight thumbnail (Max 128x128, JPEG 70%)
                val maxThumbDim = 128
                val thumbBitmap = scalePreservingAspect(finalFullBitmap, maxThumbDim)
                FileOutputStream(targetThumbFile).use { out ->
                    thumbBitmap.compress(Bitmap.CompressFormat.JPEG, 70, out)
                    out.flush()
                }

                val finalWidth = finalFullBitmap.width
                val finalHeight = finalFullBitmap.height
                val fileSizeBytes = targetFullFile.length()

                // Clean up in-memory bitmaps
                if (thumbBitmap != finalFullBitmap) {
                    thumbBitmap.recycle()
                }
                finalFullBitmap.recycle()

                // 6. Delete transient source file if it was located in cache or picker folder
                cleanSourceIfInCache(inputFile)

                val result = Arguments.createMap().apply {
                    putString("photoUri", Uri.fromFile(targetFullFile).toString())
                    putString("thumbnailUri", Uri.fromFile(targetThumbFile).toString())
                    putInt("width", finalWidth)
                    putInt("height", finalHeight)
                    putDouble("fileSizeBytes", fileSizeBytes.toDouble())
                    putString("hash", hash)
                    putBoolean("isDuplicate", false)
                }

                promise.resolve(result)
            } catch (e: Throwable) {
                promise.reject("STORAGE_PROCESS_ERROR", e.message, e)
            } finally {
                tempInputFile?.delete()
            }
        }.start()
    }

    @ReactMethod
    fun getStorageMetrics(promise: Promise) {
        Thread {
            try {
                val cacheSize = getDirectorySize(reactContext.cacheDir)
                val mediaSize = getDirectorySize(mediaDir)
                val thumbSize = getDirectorySize(thumbsDir)

                var dbSize = 0L
                val dbFile = reactContext.getDatabasePath("dayora.db")
                if (dbFile.exists()) dbSize += dbFile.length()
                val dbWal = File(dbFile.parentFile, "dayora.db-wal")
                if (dbWal.exists()) dbSize += dbWal.length()
                val dbShm = File(dbFile.parentFile, "dayora.db-shm")
                if (dbShm.exists()) dbSize += dbShm.length()

                val totalSize = cacheSize + mediaSize + thumbSize + dbSize

                val mediaCount = mediaDir.listFiles()?.count { it.isFile } ?: 0
                val thumbCount = thumbsDir.listFiles()?.count { it.isFile } ?: 0

                val result = Arguments.createMap().apply {
                    putDouble("cacheSizeBytes", cacheSize.toDouble())
                    putDouble("mediaSizeBytes", mediaSize.toDouble())
                    putDouble("thumbnailSizeBytes", thumbSize.toDouble())
                    putDouble("databaseSizeBytes", dbSize.toDouble())
                    putDouble("totalAppSizeBytes", totalSize.toDouble())
                    putInt("mediaCount", mediaCount)
                    putInt("thumbnailCount", thumbCount)
                }

                promise.resolve(result)
            } catch (e: Throwable) {
                promise.reject("STORAGE_METRICS_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun cleanupTemporaryCache(promise: Promise) {
        Thread {
            try {
                var bytesCleared = 0L
                var filesDeleted = 0

                val cacheFiles = reactContext.cacheDir.listFiles() ?: emptyArray()
                for (file in cacheFiles) {
                    bytesCleared += deleteRecursively(file)
                    filesDeleted++
                }

                val result = Arguments.createMap().apply {
                    putDouble("bytesCleared", bytesCleared.toDouble())
                    putInt("filesDeleted", filesDeleted)
                }

                promise.resolve(result)
            } catch (e: Throwable) {
                promise.reject("CACHE_CLEANUP_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun cleanOrphanedMedia(activeUris: ReadableArray, promise: Promise) {
        Thread {
            try {
                // Collect set of normalized active filenames/paths
                val activeSet = HashSet<String>()
                for (i in 0 until activeUris.size()) {
                    val uriStr = activeUris.getString(i) ?: continue
                    val path = Uri.parse(uriStr).path ?: uriStr
                    val fileName = File(path).name
                    activeSet.add(fileName)
                    activeSet.add(path)
                    activeSet.add(uriStr)
                }

                var deletedCount = 0
                var reclaimedBytes = 0L

                // Clean orphaned files from mediaDir
                mediaDir.listFiles()?.forEach { file ->
                    if (file.isFile && !activeSet.contains(file.name) && !activeSet.contains(file.absolutePath)) {
                        reclaimedBytes += file.length()
                        if (file.delete()) deletedCount++
                    }
                }

                // Clean orphaned files from thumbsDir
                thumbsDir.listFiles()?.forEach { file ->
                    val parentName = file.name.replace("_thumb.jpg", ".jpg")
                    if (file.isFile && !activeSet.contains(file.name) && !activeSet.contains(parentName)) {
                        reclaimedBytes += file.length()
                        if (file.delete()) deletedCount++
                    }
                }

                val result = Arguments.createMap().apply {
                    putInt("deletedFilesCount", deletedCount)
                    putDouble("reclaimedBytes", reclaimedBytes.toDouble())
                }

                promise.resolve(result)
            } catch (e: Throwable) {
                promise.reject("ORPHAN_CLEANUP_ERROR", e.message, e)
            }
        }.start()
    }

    @ReactMethod
    fun releaseImageMemory(promise: Promise) {
        try {
            System.gc()
            Runtime.getRuntime().gc()
            (reactContext.applicationContext as? ComponentCallbacks2)?.onTrimMemory(
                ComponentCallbacks2.TRIM_MEMORY_RUNNING_CRITICAL
            )
            promise.resolve(true)
        } catch (e: Throwable) {
            promise.resolve(false)
        }
    }

    @ReactMethod
    fun exportBackupFile(jsonString: String, suggestedFileName: String, promise: Promise) {
        Thread {
            try {
                val exportsDir = File(reactContext.cacheDir, "exports").apply { if (!exists()) mkdirs() }
                val fileName = if (suggestedFileName.isNotBlank()) suggestedFileName else "dayora_backup_${System.currentTimeMillis()}.json"
                val exportFile = File(exportsDir, fileName)

                FileOutputStream(exportFile).use { out ->
                    out.write(jsonString.toByteArray(Charsets.UTF_8))
                    out.flush()
                }

                var savedToDownloads = false
                try {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        val values = ContentValues().apply {
                            put(MediaStore.MediaColumns.DISPLAY_NAME, fileName)
                            put(MediaStore.MediaColumns.MIME_TYPE, "application/json")
                            put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/Dayora")
                        }
                        val resolver = reactContext.contentResolver
                        val uri = resolver.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values)
                        if (uri != null) {
                            resolver.openOutputStream(uri)?.use { os ->
                                os.write(jsonString.toByteArray(Charsets.UTF_8))
                                os.flush()
                            }
                            savedToDownloads = true
                        }
                    } else {
                        val downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)
                        val dayoraDir = File(downloadsDir, "Dayora").apply { if (!exists()) mkdirs() }
                        val publicFile = File(dayoraDir, fileName)
                        FileOutputStream(publicFile).use { os ->
                            os.write(jsonString.toByteArray(Charsets.UTF_8))
                            os.flush()
                        }
                        savedToDownloads = true
                    }
                } catch (_: Throwable) {
                    // Fallback to share intent
                }

                // Open Share Sheet via FileProvider
                val contentUri = FileProvider.getUriForFile(
                    reactContext,
                    "${reactContext.packageName}.dayora.provider",
                    exportFile
                )

                val shareIntent = Intent(Intent.ACTION_SEND).apply {
                    type = "application/json"
                    putExtra(Intent.EXTRA_STREAM, contentUri)
                    putExtra(Intent.EXTRA_SUBJECT, "Dayora Data Backup")
                    putExtra(Intent.EXTRA_TEXT, "Here is your Dayora backup file: $fileName")
                    addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
                }

                val chooser = Intent.createChooser(shareIntent, "Save or Share Dayora Backup").apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                reactContext.startActivity(chooser)

                val result = Arguments.createMap().apply {
                    putBoolean("success", true)
                    putString("filePath", exportFile.absolutePath)
                    putString("fileName", fileName)
                    putBoolean("savedToDownloads", savedToDownloads)
                }
                promise.resolve(result)
            } catch (e: Throwable) {
                promise.reject("EXPORT_ERROR", "Failed to export backup: ${e.message}", e)
            }
        }.start()
    }

    @ReactMethod
    fun pickAndImportBackupFile(promise: Promise) {
        val activity = reactApplicationContext.currentActivity
        if (activity == null) {
            promise.reject("NO_ACTIVITY", "Cannot open file picker: Activity is not available.")
            return
        }
        importPromise = promise
        try {
            val intent = Intent(Intent.ACTION_OPEN_DOCUMENT).apply {
                addCategory(Intent.CATEGORY_OPENABLE)
                type = "*/*"
                putExtra(Intent.EXTRA_MIME_TYPES, arrayOf("application/json", "text/plain", "application/octet-stream", "*/*"))
            }
            activity.startActivityForResult(intent, IMPORT_REQUEST_CODE)
        } catch (e: Throwable) {
            importPromise = null
            promise.reject("PICKER_ERROR", "Failed to start file picker: ${e.message}", e)
        }
    }

    // Helper functions
    private fun calculateSha256(file: File): String {
        val digest = MessageDigest.getInstance("SHA-256")
        FileInputStream(file).use { fis ->
            val buffer = ByteArray(8192)
            var read: Int
            while (fis.read(buffer).also { read = it } != -1) {
                digest.update(buffer, 0, read)
            }
        }
        val hashBytes = digest.digest()
        return hashBytes.joinToString("") { "%02x".format(it) }
    }

    private fun calculateInSampleSize(
        width: Int,
        height: Int,
        reqWidth: Int,
        reqHeight: Int
    ): Int {
        var inSampleSize = 1
        if (height > reqHeight || width > reqWidth) {
            val halfHeight = height / 2
            val halfWidth = width / 2
            while ((halfHeight / inSampleSize) >= reqHeight && (halfWidth / inSampleSize) >= reqWidth) {
                inSampleSize *= 2
            }
        }
        return inSampleSize
    }

    private fun getExifOrientation(file: File): Int {
        return try {
            val exif = ExifInterface(file.absolutePath)
            exif.getAttributeInt(ExifInterface.TAG_ORIENTATION, ExifInterface.ORIENTATION_NORMAL)
        } catch (e: Throwable) {
            ExifInterface.ORIENTATION_NORMAL
        }
    }

    private fun applyExifOrientation(bitmap: Bitmap, orientation: Int): Bitmap {
        val matrix = Matrix()
        when (orientation) {
            ExifInterface.ORIENTATION_ROTATE_90 -> matrix.postRotate(90f)
            ExifInterface.ORIENTATION_ROTATE_180 -> matrix.postRotate(180f)
            ExifInterface.ORIENTATION_ROTATE_270 -> matrix.postRotate(270f)
            ExifInterface.ORIENTATION_FLIP_HORIZONTAL -> matrix.postScale(-1f, 1f)
            ExifInterface.ORIENTATION_FLIP_VERTICAL -> matrix.postScale(1f, -1f)
            else -> return bitmap
        }
        return Bitmap.createBitmap(bitmap, 0, 0, bitmap.width, bitmap.height, matrix, true)
    }

    private fun scalePreservingAspect(bitmap: Bitmap, maxDim: Int): Bitmap {
        val w = bitmap.width
        val h = bitmap.height
        if (w <= maxDim && h <= maxDim) return bitmap

        val ratio = w.toFloat() / h.toFloat()
        val newW: Int
        val newH: Int
        if (w > h) {
            newW = maxDim
            newH = Math.max(1, (maxDim / ratio).toInt())
        } else {
            newH = maxDim
            newW = Math.max(1, (maxDim * ratio).toInt())
        }

        return Bitmap.createScaledBitmap(bitmap, newW, newH, true)
    }

    private fun cleanSourceIfInCache(file: File) {
        try {
            val cachePath = reactContext.cacheDir.absolutePath
            if (file.absolutePath.startsWith(cachePath)) {
                file.delete()
            }
        } catch (_: Throwable) {}
    }

    private fun getDirectorySize(dir: File): Long {
        if (!dir.exists()) return 0L
        var size = 0L
        val files = dir.listFiles() ?: return 0L
        for (file in files) {
            size += if (file.isDirectory) getDirectorySize(file) else file.length()
        }
        return size
    }

    private fun deleteRecursively(file: File): Long {
        var size = 0L
        if (file.isDirectory) {
            file.listFiles()?.forEach { child ->
                size += deleteRecursively(child)
            }
        } else {
            size = file.length()
        }
        file.delete()
        return size
    }
}
