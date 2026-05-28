package com.acams

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import java.io.File
import kotlin.math.max
import kotlin.math.min

class FaceImagePreprocessorModule(
  reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "FaceImagePreprocessor"

  @ReactMethod
  fun preprocessImage(
    imagePath: String,
    faceBounds: ReadableMap?,
    inputSize: Double,
    promise: Promise
  ) {
    try {
      val cleanPath = imagePath.removePrefix("file://")
      val file = File(cleanPath)
      if (!file.exists()) {
        promise.reject("FACE_IMAGE_NOT_FOUND", "Image file does not exist: $cleanPath")
        return
      }

      val source = BitmapFactory.decodeFile(cleanPath)
      if (source == null) {
        promise.reject("FACE_IMAGE_DECODE_FAILED", "Unable to decode image: $cleanPath")
        return
      }

      val targetSize = inputSize.toInt().coerceAtLeast(1)
      val cropRect = resolveCrop(source.width, source.height, faceBounds)
      val cropped = Bitmap.createBitmap(
        source,
        cropRect.left,
        cropRect.top,
        cropRect.width,
        cropRect.height
      )
      val resized = Bitmap.createScaledBitmap(cropped, targetSize, targetSize, true)

      val pixels = IntArray(targetSize * targetSize)
      resized.getPixels(pixels, 0, targetSize, 0, 0, targetSize, targetSize)

      val output = Arguments.createArray()
      for (pixel in pixels) {
        val r = (pixel shr 16) and 0xFF
        val g = (pixel shr 8) and 0xFF
        val b = pixel and 0xFF

        // FaceNet-style [-1, 1] normalization. Enrollment and live attendance
        // share this exact path so their embeddings remain comparable.
        output.pushDouble((r - 127.5) / 128.0)
        output.pushDouble((g - 127.5) / 128.0)
        output.pushDouble((b - 127.5) / 128.0)
      }

      if (!source.isRecycled) source.recycle()
      if (!cropped.isRecycled) cropped.recycle()
      if (!resized.isRecycled) resized.recycle()

      promise.resolve(output)
    } catch (error: Exception) {
      promise.reject("FACE_IMAGE_PREPROCESS_FAILED", error.message, error)
    }
  }

  private fun resolveCrop(
    imageWidth: Int,
    imageHeight: Int,
    faceBounds: ReadableMap?
  ): CropRect {
    if (faceBounds == null) {
      return centerSquare(imageWidth, imageHeight)
    }

    val rawWidth = readDouble(faceBounds, "width")
    val rawHeight = readDouble(faceBounds, "height")
    if (rawWidth <= 0.0 || rawHeight <= 0.0) {
      return centerSquare(imageWidth, imageHeight)
    }

    val rawX = readDouble(faceBounds, "x")
    val rawY = readDouble(faceBounds, "y")

    val looksNormalized =
      rawX >= 0.0 && rawY >= 0.0 && rawX <= 1.0 && rawY <= 1.0 && rawWidth <= 1.0 && rawHeight <= 1.0

    var x = if (looksNormalized) rawX * imageWidth else rawX
    var y = if (looksNormalized) rawY * imageHeight else rawY
    var width = if (looksNormalized) rawWidth * imageWidth else rawWidth
    var height = if (looksNormalized) rawHeight * imageHeight else rawHeight

    // If the detector reports preview-space bounds that are much larger than
    // the snapshot, fall back to a stable center crop instead of bad indexing.
    if (x > imageWidth || y > imageHeight || width > imageWidth * 2 || height > imageHeight * 2) {
      return centerSquare(imageWidth, imageHeight)
    }

    val side = max(width, height) * 1.35
    x -= (side - width) / 2.0
    y -= (side - height) / 2.0

    val left = max(0, x.toInt())
    val top = max(0, y.toInt())
    val right = min(imageWidth, (x + side).toInt())
    val bottom = min(imageHeight, (y + side).toInt())

    if (right - left < 32 || bottom - top < 32) {
      return centerSquare(imageWidth, imageHeight)
    }

    return CropRect(left, top, right - left, bottom - top)
  }

  private fun readDouble(map: ReadableMap, key: String): Double {
    if (!map.hasKey(key) || map.isNull(key)) return 0.0
    return when (map.getType(key).name) {
      "Number" -> map.getDouble(key)
      else -> 0.0
    }
  }

  private fun centerSquare(imageWidth: Int, imageHeight: Int): CropRect {
    val side = min(imageWidth, imageHeight)
    return CropRect((imageWidth - side) / 2, (imageHeight - side) / 2, side, side)
  }

  private data class CropRect(
    val left: Int,
    val top: Int,
    val width: Int,
    val height: Int
  )
}
