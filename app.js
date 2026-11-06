const form = document.querySelector("#buildForm");
const button = document.querySelector("#buildBtn");
const status = document.querySelector("#status");
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const file = document.querySelector("#projectFile").files[0];
  if (!file) return;
  button.disabled = true;
  status.textContent = "Build தொடங்குகிறது... Server APK உருவாக்க சிறிது நேரம் ஆகலாம்.";
  try {
    const data = new FormData(form);
    const response = await fetch("/api/build", { method: "POST", body: data });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Build தோல்வியடைந்தது.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (document.querySelector("#appName").value || "app").replace(/[^a-z0-9_-]/gi, "_") + ".apk";
    a.click();
    URL.revokeObjectURL(url);
    status.textContent = "APK தயார்! Download தொடங்கியது.";
  } catch (e) {
    status.textContent = "பிழை: " + e.message;
  } finally {
    button.disabled = false;
  }
});
