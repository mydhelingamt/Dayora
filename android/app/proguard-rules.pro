# Project specific ProGuard rules for Dayora
# Optimize for minimum APK size and smooth execution

# React Native core
-keep class com.facebook.react.** { *; }
-keep class com.facebook.jni.** { *; }
-keep class com.facebook.hermes.unicode.** { *; }
-keep class com.facebook.soloader.** { *; }

# React Native Screens
-keep class com.swmansion.rnscreens.** { *; }

# React Native Safe Area Context
-keep class com.th3rdwave.safeareacontext.** { *; }

# op-sqlite native bindings
-keep class com.op.sqlite.** { *; }
-keep class com.opspec.** { *; }

# AndroidX components
-keep class androidx.appcompat.** { *; }
-keep class androidx.fragment.app.** { *; }
-keep class androidx.core.** { *; }

# Dayora Native modules and receivers
-keep class com.dayora.** { *; }

# React Native Image Picker
-keep class com.imagepicker.** { *; }

# Preserve reflection attributes needed by React Native & TurboModules
-keepattributes *Annotation*,Signature,InnerClasses,EnclosingMethod

# Suppress harmless warnings on optional dependencies
-dontwarn okio.**
-dontwarn javax.annotation.**
-dontwarn com.facebook.infer.annotation.**
-dontwarn com.imagepicker.**
