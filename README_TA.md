# MY APK BUILDER – Version 1.0 (Starter)

இது நமது சொந்த APK Builder-க்கான முதல் கட்ட Source Code.

## இதில் உள்ளவை
- HTML கோப்பை upload செய்தல்
- ZIP கோப்பை upload செய்தல் (ZIP-ல் `index.html` இருக்க வேண்டும்)
- Android WebView project உருவாக்குதல்
- Server-ல் Android SDK + Gradle மூலம் APK build செய்யும் backend கட்டமைப்பு

## முக்கிய குறிப்பு
இந்த source code ஒரு **starter/MVP**. APK build ஆக, Android SDK மற்றும் Java உள்ள Linux build server தேவை. இந்த ZIP-ஐ மட்டும் Android mobile-ல் திறந்தால் APK compile ஆகாது.

## தேவைகள்
- Node.js 20+
- Java 17
- Android SDK (platform 35, build-tools 35.0.0)
- Gradle 8.9+ (server-ல்)
- Linux server பரிந்துரைக்கப்படுகிறது

## இயக்குவது
1. ZIP-ஐ கணினியில் extract செய்யவும்.
2. `cd server`
3. `npm install`
4. `npm start`
5. Browser-ல் `http://localhost:3000` திறக்கவும்.

## APK build
Server-ல் `ANDROID_HOME` environment variable Android SDK folder-ஐக் காட்ட வேண்டும்.
`JAVA_HOME` Java 17 folder-ஐக் காட்ட வேண்டும்.
Upload செய்யப்பட்ட HTML/ZIP-க்கு backend Android WebView project உருவாக்கி Gradle build இயக்கும்.

## பாதுகாப்பு
இந்த ஆரம்ப பதிப்பை public internet-ல் authentication, upload size limits, isolated build containers, rate limits, malware scanning ஆகியவை சேர்க்காமல் deploy செய்ய வேண்டாம். Arbitrary Android project upload/build வசதி இந்த முதல் பதிப்பில் சேர்க்கப்படவில்லை.
