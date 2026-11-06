
document.addEventListener("DOMContentLoaded", () => {
  const appName = document.getElementById("appName");
  const projectFile = document.getElementById("projectFile");
  const buildButton = document.getElementById("buildButton");
  const status = document.getElementById("status");

  buildButton.addEventListener("click", async () => {
    const file = projectFile.files[0];

    if (!file) {
      status.textContent = "Please select an HTML or ZIP file.";
      return;
    }

    const formData = new FormData();
    formData.append("appName", appName.value.trim() || "MyWebApp");
    formData.append("projectFile", file);

    buildButton.disabled = true;
    status.textContent = "Uploading and building APK... Please wait.";

    try {
      const response = await fetch("/api/build", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        let message = "Build failed.";
        try {
          const data = await response.json();
          message = data.error || message;
        } catch {}
        throw new Error(message);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download =
        (appName.value.trim() || "MyWebApp")
          .replace(/[^a-zA-Z0-9_-]/g, "_") + ".apk";

      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      status.textContent = "APK downloaded successfully!";
    } catch (error) {
      status.textContent = "Error: " + error.message;
    } finally {
      buildButton.disabled = false;
    }
  });
});
    
