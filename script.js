let cameraStream;

function initSignupCamera() {
  const video = document.getElementById("signupCamera");
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    cameraStream = stream;
    video.srcObject = stream;
  });
}

function initLoginCamera() {
  const video = document.getElementById("loginCamera");
  navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
    cameraStream = stream;
    video.srcObject = stream;
    autoLoginWithPalm(video);
  });
}

function captureMultiplePalms() {
  const username = document.getElementById("username").value;
  if (!username) {
    alert("Please enter your name.");
    return;
  }

  const video = document.getElementById("signupCamera");
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");

  const palmImages = [];
  let count = 0;
  document.getElementById("progress").innerText = "Capturing palm images...";

  const capture = setInterval(() => {
    ctx.filter = 'contrast(150%) brightness(90%) grayscale(100%)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const palmImage = canvas.toDataURL("image/png");
    palmImages.push(palmImage);
    count++;
    document.getElementById("progress").innerText = `Captured ${count}/10`;

    if (count === 10) {
      clearInterval(capture);
      localStorage.setItem("username", username);
      localStorage.setItem("palmImages", JSON.stringify(palmImages));
      alert("Signup complete. Try logging in.");
      window.location.href = "index.html";
    }
  }, 700); // 700ms gap between captures
}

function autoLoginWithPalm(video) {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const savedImages = JSON.parse(localStorage.getItem("palmImages") || "[]");
  if (savedImages.length === 0) {
    document.getElementById("status").innerText = "No signup data found.";
    return;
  }

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const scan = setInterval(() => {
    ctx.filter = 'contrast(150%) brightness(90%) grayscale(100%)';
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const currentData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    let matchFound = false;
    let checked = 0;

    savedImages.forEach(base64 => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(img, 0, 0);
        const savedData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

        const match = compareImageData(currentData, savedData);
        checked++;

        if (match && !matchFound) {
          matchFound = true;
          clearInterval(scan);
          window.location.href = "home.html";
        } else if (checked === savedImages.length && !matchFound) {
          document.getElementById("status").innerText = "Palm not recognized. Scanning again...";
        }
      };
      img.src = base64;
    });
  }, 1500); // scan every 1.5s
}

function compareImageData(img1, img2) {
  if (img1.width !== img2.width || img1.height !== img2.height) return false;

  let totalPixels = img1.data.length / 4;
  let matchPixels = 0;

  for (let i = 0; i < img1.data.length; i += 4) {
    const diff = Math.abs(img1.data[i] - img2.data[i]) +
                 Math.abs(img1.data[i + 1] - img2.data[i + 1]) +
                 Math.abs(img1.data[i + 2] - img2.data[i + 2]);
    if (diff < 30) {
      matchPixels++;
    }
  }

  const similarity = (matchPixels / totalPixels) * 100;
  return similarity > 70;
}
