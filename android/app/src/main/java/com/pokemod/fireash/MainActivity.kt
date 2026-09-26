package com.pokemod.fireash

import android.net.Uri
import android.os.Bundle
import android.util.Base64
import android.webkit.JavascriptInterface
import android.webkit.WebSettings
import android.webkit.WebView
import androidx.activity.result.contract.ActivityResultContracts
import androidx.appcompat.app.AppCompatActivity
import androidx.documentfile.provider.DocumentFile
import org.json.JSONArray
import org.json.JSONObject

/**
 * PokeMod Studio — Fire Ash Edition (APK).
 * WebView sin conexión que carga la app de assets + puente SAF para editar
 * la carpeta de Fire Ash (la misma que usa Kirin). Sin NDK → APK universal
 * compatible con ARM64 (Kirin/Snapdragon/Exynos), ARMv7 y x86_64.
 */
class MainActivity : AppCompatActivity() {

    private lateinit var web: WebView
    private var treeUri: Uri? = null

    private val pickFolder = registerForActivityResult(ActivityResultContracts.OpenDocumentTree()) { uri ->
        if (uri != null) {
            contentResolver.takePersistableUriPermission(
                uri, android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION or android.content.Intent.FLAG_GRANT_WRITE_URI_PERMISSION
            )
            treeUri = uri
            getSharedPreferences("pokemod", MODE_PRIVATE).edit().putString("tree", uri.toString()).apply()
            val name = root()?.name ?: "carpeta"
            web.evaluateJavascript("window.__pmResolveFolder && window.__pmResolveFolder(${JSONObject.quote(name)})", null)
        } else {
            web.evaluateJavascript("window.__pmResolveFolder && window.__pmResolveFolder('')", null)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        getSharedPreferences("pokemod", MODE_PRIVATE).getString("tree", null)?.let {
            try { treeUri = Uri.parse(it) } catch (_: Exception) { }
        }
        web = WebView(this)
        setContentView(web)
        with(web.settings) {
            javaScriptEnabled = true
            domStorageEnabled = true
            allowFileAccess = true
            mediaPlaybackRequiresUserGesture = false
            cacheMode = WebSettings.LOAD_DEFAULT
        }
        web.addJavascriptInterface(Bridge(), "PokeModBridge")
        web.loadUrl("file:///android_asset/web/index.html")
    }

    private fun root(): DocumentFile? {
        val u = treeUri ?: return null
        return DocumentFile.fromTreeUri(this, u)
    }

    /** Busca hijo con caja exacta o aproximada (¡clave! Windows perdona, Android no). */
    private fun childOf(dir: DocumentFile, name: String, wantDir: Boolean? = null): DocumentFile? {
        dir.findFile(name)?.let { if (wantDir == null || it.isDirectory == wantDir) return it }
        for (f in dir.listFiles()) {
            if (f.name != null && f.name.equals(name, ignoreCase = true)) {
                if (wantDir == null || f.isDirectory == wantDir) return f
            }
        }
        return null
    }

    private fun resolve(rel: String): DocumentFile? {
        var cur = root() ?: return null
        val parts = rel.split("/").filter { it.isNotEmpty() && it != "." }
        for (p in parts) {
            cur = childOf(cur, p) ?: return null
        }
        return cur
    }

    private fun mimeFor(name: String): String = when (name.substringAfterLast('.', "").lowercase()) {
        "png" -> "image/png"
        "jpg", "jpeg" -> "image/jpeg"
        "bmp" -> "image/bmp"
        "txt", "ini", "json", "rb" -> "text/plain"
        else -> "application/octet-stream"
    }

    inner class Bridge {

        @JavascriptInterface
        fun pmHasFolder(): String = if (root() != null) "1" else "0"

        @JavascriptInterface
        fun pmPickFolder() {
            runOnUiThread { pickFolder.launch(null) }
        }

        @JavascriptInterface
        fun pmFolderName(): String = root()?.name ?: ""

        @JavascriptInterface
        fun pmExists(rel: String): String = if (resolve(rel) != null) "1" else "0"

        @JavascriptInterface
        fun pmSize(rel: String): String = resolve(rel)?.length()?.toString() ?: "-1"

        @JavascriptInterface
        fun pmList(rel: String): String {
            val dir = if (rel.isEmpty()) root() else resolve(rel)
                ?: throw IllegalArgumentException("No existe: $rel")
            val arr = JSONArray()
            for (f in dir.listFiles()) {
                val o = JSONObject()
                o.put("n", f.name ?: "")
                o.put("d", f.isDirectory)
                o.put("s", if (f.isDirectory) 0 else f.length())
                arr.put(o)
            }
            return arr.toString()
        }

        @JavascriptInterface
        fun pmRead(rel: String): String {
            val f = resolve(rel) ?: throw IllegalArgumentException("No existe: $rel")
            val bytes = contentResolver.openInputStream(f.uri)?.use { it.readBytes() }
                ?: throw IllegalStateException("No se pudo leer: $rel")
            return Base64.encodeToString(bytes, Base64.NO_WRAP)
        }

        @JavascriptInterface
        fun pmReadChunk(rel: String, off: Int, len: Int): String {
            val f = resolve(rel) ?: throw IllegalArgumentException("No existe: $rel")
            contentResolver.openInputStream(f.uri)?.use { ins ->
                var toSkip = off.toLong()
                while (toSkip > 0) {
                    val s = ins.skip(toSkip)
                    if (s <= 0) break
                    toSkip -= s
                }
                val buf = ByteArray(len)
                var got = 0
                while (got < len) {
                    val r = ins.read(buf, got, len - got)
                    if (r < 0) break
                    got += r
                }
                return Base64.encodeToString(buf.copyOf(got), Base64.NO_WRAP)
            } ?: throw IllegalStateException("No se pudo leer: $rel")
        }

        @JavascriptInterface
        fun pmWrite(rel: String, b64: String): String {
            val data = Base64.decode(b64, Base64.DEFAULT)
            val parts = rel.split("/").filter { it.isNotEmpty() && it != "." }
            if (parts.isEmpty()) throw IllegalArgumentException("Ruta vacía")
            var dir = root() ?: throw IllegalStateException("Sin carpeta")
            for (p in parts.dropLast(1)) {
                dir = childOf(dir, p, true) ?: dir.createDirectory(p)
                    ?: throw IllegalStateException("No se pudo crear: $p")
            }
            val name = parts.last()
            var file = childOf(dir, name, false)
            if (file == null) {
                file = dir.createFile(mimeFor(name), name)
                    ?: throw IllegalStateException("No se pudo crear: $name")
            }
            contentResolver.openOutputStream(file.uri, "wt")?.use { it.write(data) }
                ?: throw IllegalStateException("No se pudo escribir: $rel")
            return "ok"
        }

        @JavascriptInterface
        fun pmDelete(rel: String): String {
            val f = resolve(rel) ?: throw IllegalArgumentException("No existe: $rel")
            if (!f.delete()) throw IllegalStateException("No se pudo borrar: $rel")
            return "ok"
        }

        @JavascriptInterface
        fun pmMkdir(rel: String): String {
            var dir = root() ?: throw IllegalStateException("Sin carpeta")
            for (p in rel.split("/").filter { it.isNotEmpty() && it != "." }) {
                dir = childOf(dir, p, true) ?: dir.createDirectory(p)
                    ?: throw IllegalStateException("No se pudo crear: $p")
            }
            return "ok"
        }

        @JavascriptInterface
        fun pmWalk(rel: String, max: Int): String {
            val out = JSONArray()
            var count = 0
            fun rec(dir: DocumentFile, prefix: String) {
                if (count >= max) return
                for (f in dir.listFiles()) {
                    if (count >= max) return
                    val p = if (prefix.isEmpty()) (f.name ?: "") else prefix + "/" + (f.name ?: "")
                    if (f.isDirectory) rec(f, p)
                    else {
                        out.put(p)
                        count++
                    }
                }
            }
            val start = if (rel.isEmpty()) root() else resolve(rel)
            if (start != null && start.isDirectory) rec(start, rel.trim('/'))
            // pmWalk("") debe devolver rutas relativas a la raíz:
            if (rel.isEmpty()) {
                val fixed = JSONArray()
                for (i in 0 until out.length()) fixed.put(out.getString(i).trimStart('/'))
                return fixed.toString()
            }
            return out.toString()
        }
    }
}
