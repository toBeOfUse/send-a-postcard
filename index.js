import frontImages from "./covers/sources.js";
import { Keyframe, Track } from "./animation.js";

let currentFrontImage = 0;
const originalImages = frontImages.slice(0);
const shuffledImages = [];
while (shuffledImages.length < frontImages.length) {
    const randomItem = Math.floor(Math.random() * originalImages.length);
    shuffledImages.push(originalImages[randomItem]);
    originalImages.splice(randomItem, 1);
}

function setFrontImage() {
    const image = shuffledImages[currentFrontImage];
    document.querySelector("#card-front").src = "covers/" + image.filename;
    document.querySelector("#image-desc").innerHTML = image.description;
    currentFrontImage += 1;
    currentFrontImage %= shuffledImages.length;
}

setFrontImage();
document.querySelector("#writespace")?.focus();

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
let sendable = true;
function applyCardTransforms(extras) {
    card.style.transform =
        "perspective(600px) " +
        (extras || "") +
        `translate3d(${cardXMove}px, ${cardYMove}px, ${cardZMove}px) ` +
        `rotate3d(1, 0, 0, ${cardXDeg}deg) ` +
        `rotate3d(0, 1, 0, ${cardYDeg}deg) `;
    cardFront.style.transform =
        "perspective(600px) " +
        (extras || "") +
        `translate3d(${cardXMove}px, ${cardYMove}px, ${cardZMove}px) ` +
        `rotate3d(1, 0, 0, ${cardXDeg}deg) ` +
        `rotate3d(0, 1, 0, ${cardYDeg + 180}deg)`;
}
function animateSpin() {
    if (cardAnimating) {
        return;
    }
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
    let startTime = -1;
    const step = (timestamp) => {
        cardXDeg = ambientXDeg;
        if (startTime == -1) {
            startTime = timestamp;
            requestAnimationFrame(step);
        } else {
            const timePassed = timestamp - startTime;
            const degrees = track.getValue(timePassed);
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
    if (cardAnimating) {
        return;
    }
    cardAnimating = true;
    sendable = false;
    const backupLength = 2000;
    const loopLength = 1000;
    const leaveLength = 1000;
    const totalLength = backupLength + loopLength + leaveLength;
    const backupSpin = new Track([
        new Keyframe(0, ambientYDeg),
        new Keyframe(backupLength - 200, 900)
    ]);
    const backupFlip = new Track([
        new Keyframe(0, ambientXDeg),
        new Keyframe(backupLength / 2, 0),
        new Keyframe(backupLength - 200, 0),
        new Keyframe(backupLength, 90)
    ]);
    const backup = new Track([
        new Keyframe(0, 0),
        new Keyframe(backupLength, -3000)
    ]);
    const backupRise = new Track([
        new Keyframe(0, 0),
        new Keyframe(backupLength, -1000)
    ]);
    const loop = new Track([
        new Keyframe(backupLength, 0),
        new Keyframe(backupLength + loopLength, 360)
    ]);
    const leave = new Track([
        new Keyframe(backupLength + loopLength, 0),
        new Keyframe(totalLength, 5000)
    ]);
    let startTime = -1;
    const step = (timestamp) => {
        cardXDeg = ambientXDeg;
        if (startTime == -1) {
            startTime = timestamp;
            requestAnimationFrame(step);
        } else {
            const timePassed = timestamp - startTime;
            if (timePassed <= totalLength) {
                cardYDeg = backupSpin.getValue(timePassed);
                cardXDeg = backupFlip.getValue(timePassed);
                cardZMove = backup.getValue(timePassed);
                cardYMove = backupRise.getValue(timePassed);
                cardXMove = leave.getValue(timePassed);
                const cardZDeg = loop.getValue(timePassed);
                applyCardTransforms(`rotate3d(0,0,1,${cardZDeg}deg) `);
                requestAnimationFrame(step);
            } else {
                animateReappear();
            }
        }
    };
    requestAnimationFrame(step);
}
function animateReappear() {
    document.querySelector("#writespace").value = "";
    setFrontImage();
    const pause = 1000;
    const reappearLength = 1000;
    const reappear = new Track([
        new Keyframe(0, -1000),
        new Keyframe(pause, -1000),
        new Keyframe(pause + reappearLength, 0)
    ]);
    cardYDeg = 0;
    cardXDeg = 0;
    cardZMove = 0;
    cardXMove = 0;
    cardAnimating = false;
    let startTime = -1;
    const step = (timestamp) => {
        if (startTime == -1) {
            startTime = timestamp;
        } else {
            const timePassed = timestamp - startTime;
            if (timePassed > pause + reappearLength) {
                sendable = true;
                cardYMove = 0;
                return;
            }
            cardYMove = reappear.getValue(timePassed);
            applyCardTransforms();
        }
        requestAnimationFrame(step);
    }
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
    // prevent mousemove from triggering and causing awkward jerky rotation
    e.stopPropagation();
    e.preventDefault();
    if (e.target.id != "writespace" &&
        e.target.id != "send-button"
        && e.target.parentElement.id != "send-button"
    ) {
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
        // need to do this since default is prevented in the event listener for
        // window
        e.target.focus();
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
const send = () => {
    if (!sendable) {
        return;
    }
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
};
const sendButton = document.querySelector("#send-button");
sendButton.addEventListener("click", send);
sendButton.addEventListener("touchend", send);
