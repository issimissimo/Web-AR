import { config } from "./config";
import { TestGameOnDesktopFallback } from "../app";
import { set } from "firebase/database";


class ARButton {
  static createButton(renderer, sessionInit = {}) {

    const button = document.createElement("button");
    button.id = "ARButton";
    // button.style.width = "100%";
    // button.style.height = "40px";
    button.style.borderRadius = "90px";
    button.style.border = "3px solid";
    // button.style.outline = "none";
    // margin-top: 15px;
    button.style.display = "flex";
    button.style.alignItems = "center";
    button.style.justifyContent = "center";

    button.style.background = "var(--color-background)";
    button.style.padding = "0.8rem";
    button.style.paddingLeft = "2.8rem";
    button.style.paddingRight = "2.8rem";
    button.style.fontSize = "var(--font-size-large)";
    button.style.color = "var(--color-accent)";
    button.style.fontFamily = "SebinoSoftBold";
    button.style.minWidth = "80%";


    navigator.xr
      .isSessionSupported("immersive-ar")
      .then(function (supported) {

        if (supported) {
          button.textContent = "Entra in AR";
          button.style.pointerEvents = "auto";
          // button.style.backgroundColor = "rgba(0, 123, 255, 0.8)";
          initializeButton();
        }
        else if (config.debugOnDesktop) {
          button.textContent = "Debug su desktop";
          button.style.pointerEvents = "auto";
          // button.style.backgroundColor = "rgba(0, 123, 255, 0.8)";
          initializeButton();
        }
        else {
          button.textContent = "AR non supportata :(";
          button.style.pointerEvents = "none";
          // button.style.backgroundColor = "rgb(83, 83, 83)"
        }
      })


    function initializeButton() {
      document.addEventListener("exitAnimationsEnded", startSession)

      let currentSession = null;

      function onSessionStarted(session) {
        session.addEventListener("end", onSessionEnded);
        renderer.xr.setReferenceSpaceType("local");
        renderer.xr.setSession(session);
        currentSession = session;
      }

      function onSessionEnded() {
        currentSession.removeEventListener("end", onSessionEnded);
        currentSession = null;
      }

      function startSession() {
        console.log("✅ ARButton: startSession called");
        // Proceed with AR session initialization after animations
        document.removeEventListener("exitAnimationsEnded", startSession)
        if (config.debugOnDesktop) {
          // Function called on click when debug on desktop is enabled
          TestGameOnDesktopFallback();
        }
        else {
          // Regular AR session initialization
          if (currentSession === null) {
            navigator.xr
              .requestSession("immersive-ar", sessionInit)
              .then(onSessionStarted);
          } else {
            currentSession.end();
          }
        }
      }


      button.onclick = function () {

        // THIS BUTTON IS SPECIAL!!!
        // SO WE NEED TO SEND EVENT DISPATCHING
        // TO WAIT FOR EXIT ANIMATIONS TO END

        // Dispatch custom event
        document.dispatchEvent(new CustomEvent('arButtonClicked'));


        // setTimeout(() => {
        //   // Proceed with AR session initialization after animations
        //   if (config.debugOnDesktop) {
        //     // Function called on click when debug on desktop is enabled
        //     TestGameOnDesktopFallback();
        //   }
        //   else {
        //     // Regular AR session initialization
        //     if (currentSession === null) {
        //       navigator.xr
        //         .requestSession("immersive-ar", sessionInit)
        //         .then(onSessionStarted);
        //     } else {
        //       currentSession.end();
        //     }
        //   }
        // }, 1000); // Wait for exit animations to complete

      };
    }



    return button;
  }
}

export { ARButton };
