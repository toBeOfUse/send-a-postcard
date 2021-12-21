import frontImages from "./covers/sources.js";
import { Keyframe, Track } from "./animation.js";
document.querySelector("#writespace")?.focus();
let currentFrontImage = 0;
function setFrontImage() {
    const image = frontImages[currentFrontImage];
    document.querySelector("#card-front").src = "covers/" + image.filename;
    document.querySelector("#image-desc").innerHTML = image.description;
    currentFrontImage += 1;
    currentFrontImage %= frontImages.length;
}
setFrontImage();
const ambientTiltRange = 30;
const card = document.querySelector("#card-back");
const cardFront = document.querySelector("#card-front");
let cardAnimating = false;
let cardYDeg = 0;
let cardXDeg = 0;
let cardXMove = 0;
let cardYMove = 0;
let cardZMove = 0;
let ambientXDeg = 0;
let ambientYDeg = 0;
function applyCardTransforms() {
    card.style.transform =
        `translate3d(${cardXMove}px, ${cardYMove}px, ${cardZMove}px)` +
        `rotate3d(1, 0, 0, ${cardXDeg}deg) ` +
        `rotate3d(0, 1, 0, ${cardYDeg}deg) `;
    cardFront.style.transform =
        `translate3d(${cardXMove}px, ${cardYMove}px, ${cardZMove}px)` +
        `rotate3d(1, 0, 0, ${cardXDeg}deg) ` +
        `rotate3d(0, 1, 0, ${cardYDeg + 180}deg)`;
}
function animateSpin() {
    cardAnimating = true;
    const defaultAnimationLength = 2000;
    const animationSpline = [[0, 0], [0.15, 0.8], [0.8, 0.15], [1, 1]];
    const initialYDeg = cardYDeg;
    const track = new Track([
        new Keyframe(0, initialYDeg),
        new Keyframe(
            defaultAnimationLength,
            initialYDeg + 360 + ambientTiltRange / 2,
            animationSpline
        )]);
    let switchedImage = false;
    let startTime = -1;
    const step = (timestamp) => {
        cardXDeg = ambientXDeg;
        if (startTime == -1) {
            startTime = timestamp;
            requestAnimationFrame(step);
        } else {
            const timePassed = timestamp - startTime;
            const degrees = track.getValue(timePassed);
            if (degrees >= 270 && !switchedImage) {
                setFrontImage();
                switchedImage = true;
            }
            if (degrees - 360 >= ambientYDeg) {
                cardYDeg = ambientYDeg;
                applyCardTransforms();
                cardAnimating = false;
            } else {
                cardYDeg = degrees;
                applyCardTransforms();
                requestAnimationFrame(step);
            }
        }
    };
    requestAnimationFrame(step);
}
function animateExit() {
    cardAnimating = true;
    const backupLength = 2000;
    const backupSpin = new Track([
        new Keyframe(0, ambientYDeg),
        new Keyframe(backupLength - 200, 900)
    ]);
    const backupCorrect = new Track([
        new Keyframe(0, ambientXDeg),
        new Keyframe(backupLength / 2, 0),
        new Keyframe(backupLength - 200, 0),
        new Keyframe(backupLength, -90)
    ]);
    const backup = new Track([
        new Keyframe(0, 0),
        new Keyframe(backupLength, -3000)
    ]);
    const backupRise = new Track([
        new Keyframe(0, 0),
        new Keyframe(backupLength, -1000)
    ]);
    let startTime = -1;
    let cancelled = false;
    window.addEventListener("keypress", (e) => {
        if (e.key == "x") {
            cancelled = true;
        }
    });
    const step = (timestamp) => {
        cardXDeg = ambientXDeg;
        if (startTime == -1) {
            startTime = timestamp;
            requestAnimationFrame(step);
        } else {
            const timePassed = timestamp - startTime;
            cardYDeg = backupSpin.getValue(timePassed);
            cardXDeg = backupCorrect.getValue(timePassed);
            cardZMove = backup.getValue(timePassed);
            cardYMove = backupRise.getValue(timePassed);
            applyCardTransforms();
            if (timePassed <= backupLength && !cancelled) {
                requestAnimationFrame(step);
            }
        }
    };
    requestAnimationFrame(step);
}
window.addEventListener("mousemove", (e) => {
    const x = e.clientX / window.innerWidth - 0.5;
    const y = e.clientY / window.innerHeight - 0.5;
    ambientXDeg = -y * ambientTiltRange;
    ambientYDeg = x * ambientTiltRange;
    if (!cardAnimating) {
        cardXDeg = ambientXDeg;
        cardYDeg = ambientYDeg;
        applyCardTransforms();
    }
});
document.querySelector("#card-container").addEventListener("click", (e) => {
    e.preventDefault();
    animateSpin();
});
window.addEventListener("touchend", (e) => {
    if (e.target.id != "writespace" && e.target.id != "send-button") {
        // prevent mousemove from triggering
        e.stopPropagation();
        e.preventDefault();
        animateSpin();
    }
});
document.querySelector("#writespace").addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
});
document
    .querySelector("#writespace")
    .addEventListener("touchend", (e) => {
        e.preventDefault();
        e.stopPropagation();
    });
let prevBeta = undefined;
let prevGamma = undefined;
window.addEventListener(
    "deviceorientation",
    (e) => {
        if (prevBeta === undefined) {
            prevBeta = e.beta;
            prevGamma = e.gamma;
        } else {
            const deltaBeta = (e.beta - prevBeta) / 2;
            const deltaGamma = (e.gamma - prevGamma);
            ambientXDeg += deltaBeta;
            ambientXDeg = Math.min(ambientTiltRange / 2, ambientXDeg);
            ambientXDeg = Math.max(-ambientTiltRange / 2, ambientXDeg);
            ambientYDeg -= deltaGamma;
            ambientYDeg = Math.min(ambientTiltRange / 2, ambientYDeg);
            ambientYDeg = Math.max(-ambientTiltRange / 2, ambientYDeg);
            prevBeta = e.beta;
            prevGamma = e.gamma;
            if (!cardAnimating) {
                cardXDeg = ambientXDeg;
                cardYDeg = ambientYDeg;
                applyCardTransforms();
            }
        }
    },
    true
);
document.querySelector("#send-button").addEventListener("click", (e) => {
    const writespace = document.querySelector("#writespace");
    const message = writespace.value;
    if (message.trim()) {
        fetch("/mail/box", {
            headers: {
                "Content-Type": "text/plain"
            },
            method: "POST",
            body: message
        });
        writespace.blur();
        animateExit();
    }
});