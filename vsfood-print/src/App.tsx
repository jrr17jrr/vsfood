import { useEffect, useState } from "react";
import { getSession } from "./lib/tauri";
import { Onboarding } from "./screens/Onboarding";
import { Pairing } from "./screens/Pairing";
import { Main } from "./screens/Main";
import { History } from "./screens/History";

type Screen = "loading" | "onboarding" | "pairing" | "main" | "history";

function App() {
  const [screen, setScreen] = useState<Screen>("loading");
  const [restaurantName, setRestaurantName] = useState("");

  useEffect(() => {
    (async () => {
      const session = await getSession();
      if (session.connected) {
        setRestaurantName(session.restaurantName);
        setScreen("main");
      } else {
        setScreen("onboarding");
      }
    })();
  }, []);

  if (screen === "loading") return null;

  if (screen === "onboarding") return <Onboarding onStart={() => setScreen("pairing")} />;

  if (screen === "pairing") {
    return (
      <Pairing
        onConnected={(name) => {
          setRestaurantName(name);
          setScreen("main");
        }}
        onBack={() => setScreen("onboarding")}
      />
    );
  }

  if (screen === "history") return <History onBack={() => setScreen("main")} />;

  return (
    <Main
      restaurantName={restaurantName}
      onOpenHistory={() => setScreen("history")}
      onDisconnected={() => setScreen("onboarding")}
    />
  );
}

export default App;
