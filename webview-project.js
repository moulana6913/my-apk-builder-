
import fs from "node:fs/promises";
import path from "node:path";

export async function createAndroidProject({
  projectDir,
  sourceDir,
  appName,
  packageName
}) {
  const appDir = path.join(projectDir, "app");

  const assetsDir = path.join(
    appDir,
    "src",
    "main",
    "assets",
    "site"
  );

  const javaDir = path.join(
    appDir,
    "src",
    "main",
    "java",
    ...packageName.split(".")
  );

  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(javaDir, { recursive: true });

  await fs.cp(sourceDir, assetsDir, { recursive: true });

  await write(projectDir, "settings.gradle", `
pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = 'MyApkBuilderApp'
include ':app'
`);

  await write(projectDir, "build.gradle", `
plugins {
    id 'com.android.application' version '8.7.3' apply false
}
`);

  await write(projectDir, "gradle.properties", `
org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8
android.useAndroidX=true
`);

  await write(appDir, "build.gradle", `
plugins {
    id 'com.android.application'
}

android {
    namespace '${packageName}'
    compileSdk 35

    defaultConfig {
        applicationId '${packageName}'
        minSdk 23
        targetSdk 35
        versionCode 1
        versionName '1.0'
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.webkit:webkit:1.12.1'
}
`);

  await write(appDir, "src/main/AndroidManifest.xml", `
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>

    <application
        android:theme="@android:style/Theme.Material.Light.NoActionBar"
        android:label="${xml(appName)}"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>

        </activity>
    </application>
</manifest>
`);

  await write(javaDir, "MainActivity.java", `
package ${packageName};

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.ValueCallback;
import android.webkit.WebSettings;

public class MainActivity extends Activity {

    private ValueCallback<Uri[]> filePathCallback;
    private static final int FILE_CHOOSER_REQUEST = 100;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView web = new WebView(this);

        WebSettings settings = web.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);

        web.setWebViewClient(new WebViewClient());

        web.setWebChromeClient(new WebChromeClient() {

            @Override
            public boolean onShowFileChooser(
                WebView webView,
                ValueCallback<Uri[]> callback,
                FileChooserParams params
            ) {
                if (filePathCallback != null) {
                    filePathCallback.onReceiveValue(null);
                }

                filePathCallback = callback;

                Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("*/*");
                intent.putExtra(Intent.EXTRA_MIME_TYPES, new String[] {
                    "text/html",
                    "application/zip",
                    "application/x-zip-compressed"
                });

                try {
                    startActivityForResult(
                        Intent.createChooser(intent, "Select HTML or ZIP File"),
                        FILE_CHOOSER_REQUEST
                    );
                } catch (Exception e) {
                    filePathCallback = null;
                    callback.onReceiveValue(null);
                    return false;
                }

                return true;
            }
        });

        setContentView(web);

        web.loadUrl("file:///android_asset/site/index.html");
    }

    @Override
    protected void onActivityResult(
        int requestCode,
        int resultCode,
        Intent data
    ) {
        super.onActivityResult(requestCode, resultCode, data);

        if (requestCode == FILE_CHOOSER_REQUEST) {
            if (filePathCallback != null) {
                Uri[] results = null;

                if (resultCode == Activity.RESULT_OK && data != null) {
                    Uri uri = data.getData();

                    if (uri != null) {
                        results = new Uri[] { uri };
                    }
                }

                filePathCallback.onReceiveValue(results);
                filePathCallback = null;
            }
        }
    }
}
`);
}

async function write(dir, name, content) {
  await fs.writeFile(
    path.join(dir, name),
    content,
    "utf8"
  );
}

function xml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
