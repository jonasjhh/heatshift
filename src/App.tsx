import { useCallback, useState } from "react";
import { getSavedName, saveLastLobby, saveName } from "./app/identity";
import { InstallPrompt } from "./app/InstallPrompt";
import { codeFromLocation, setLocationCode } from "./app/route";
import { HomeScreen } from "./screens/HomeScreen";
import { LobbyScreen } from "./screens/LobbyScreen";

interface Session {
  code: string;
  name: string;
}

export function App() {
  // A returning player opening a shared link goes straight into the lobby.
  const [invitedCode] = useState(codeFromLocation);
  const [session, setSession] = useState<Session | null>(() => {
    const name = getSavedName();
    return invitedCode && name ? { code: invitedCode, name } : null;
  });
  const [notice, setNotice] = useState<string | null>(null);

  const enter = useCallback((code: string, name: string) => {
    saveName(name);
    saveLastLobby(code);
    setLocationCode(code);
    setNotice(null);
    setSession({ code, name });
  }, []);

  const exit = useCallback((message: string | null) => {
    saveLastLobby(null);
    setLocationCode(null);
    setNotice(message);
    setSession(null);
  }, []);

  return (
    <>
      <InstallPrompt />
      {session ? (
        <LobbyScreen
          key={session.code}
          code={session.code}
          name={session.name}
          onExit={exit}
        />
      ) : (
        <HomeScreen
          key={notice ?? ""}
          invitedCode={notice ? null : invitedCode}
          notice={notice}
          onEnter={enter}
        />
      )}
    </>
  );
}
