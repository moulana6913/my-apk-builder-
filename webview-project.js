import fs from "node:fs/promises";
import path from "node:path";

export async function createAndroidProject({ projectDir, sourceDir, appName, packageName }) {
  const appDir = path.join(projectDir, "app");
  const assetsDir = path.join(appDir, "src", "main", "assets", "site");
  const javaDir = path.join(appDir, "src", "main", "java", ...packageName.split("."));
  await fs.mkdir(assetsDir, { recursive: true });
  await fs.mkdir(javaDir, { recursive: true });
  await fs.cp(sourceDir, assetsDir, { recursive: true });

  await write(projectDir, "settings.gradle", `pluginManagement { repositories { google(); mavenCentral(); gradlePluginPortal() } }\ndependencyResolutionManagement { repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS); repositories { google(); mavenCentral() } }\nrootProject.name = 'MyApkBuilderApp'\ninclude ':app'\n`);
  await write(projectDir, "build.gradle", `plugins { id 'com.android.application' version '8.7.3' apply false }\n`);
  await write(projectDir, "gradle.properties", `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\n`);
  await write(appDir, "build.gradle", `plugins { id 'com.android.application' }\n\nandroid {\n    namespace '${packageName}'\n    compileSdk 35\n    defaultConfig { applicationId '${packageName}'; minSdk 23; targetSdk 35; versionCode 1; versionName '1.0' }\n}\n\n
  dependencies {
    implementation 'androidx.appcompat:appcompat:1.7.0'
    implementation 'androidx.webkit:webkit:1.12.1'
}
  await write(appDir, "src/main/AndroidManifest.xml", `<manifest xmlns:android="http://schemas.android.com/apk/res/android"><uses-permission android:name="android.permission.INTERNET"/><application android:theme="@android:style/Theme.Material.Light.NoActionBar" android:label="${xml(appName)}" android:usesCleartextTraffic="true"><activity android:name=".MainActivity" android:exported="true"><intent-filter><action android:name="android.intent.action.MAIN"/><category android:name="android.intent.category.LAUNCHER"/></intent-filter></activity></application></manifest>`);
  await write(javaDir, "MainActivity.java", `package ${packageName};\n\nimport android.app.Activity;\nimport android.os.Bundle;\nimport android.webkit.WebView;\nimport android.webkit.WebViewClient;\n\npublic class MainActivity extends Activity {\n  @Override public void onCreate(Bundle savedInstanceState) {\n    super.onCreate(savedInstanceState);\n    WebView web = new WebView(this);\n    web.getSettings().setJavaScriptEnabled(true);\n    web.getSettings().setDomStorageEnabled(true);\n    web.setWebViewClient(new WebViewClient());\n    setContentView(web);\n    web.loadUrl(\"file:///android_asset/site/index.html\");\n  }\n  @Override public void onBackPressed() { super.onBackPressed(); }\n}\n`);
}
async function write(dir, name, content) {
  await fs.writeFile(path.join(dir, name), content, "utf8");
}
function xml(s) { return s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
