import { useEffect, useState, type FormEvent } from "react";
import {
  LOBBY_CODE_LENGTH,
  MAX_NAME_LENGTH,
  MAX_PLAYERS,
  isValidLobbyCode,
  normalizeLobbyCode,
  normalizeName,
  type CarColor,
} from "../../shared/protocol";
import {
  getLastLobby,
  getPlayerId,
  getSavedColor,
  getSavedName,
} from "../app/identity";
import { ColorPicker } from "../components/ColorPicker";
import { checkLobby, createLobby } from "../lobby/api";
import {
  colors,
  help,
  input,
  label,
  linkButton,
  page,
  panel,
  primaryButton,
  secondaryButton,
} from "../ui/theme";

interface Props {
  // Code from a shared link or QR code: then only a name is needed.
  invitedCode: string | null;
  notice: string | null;
  onEnter: (code: string, name: string, color: CarColor | null) => void;
}

export function HomeScreen({ invitedCode, notice, onEnter }: Props) {
  const [name, setName] = useState(getSavedName);
  const [code, setCode] = useState(invitedCode ?? "");
  const [invited, setInvited] = useState(invitedCode !== null);
  const [color, setColor] = useState<CarColor | null>(getSavedColor);
  const [taken, setTaken] = useState<CarColor[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(notice);
  const lastLobby = getLastLobby();

  const cleanName = normalizeName(name);
  const cleanCode = normalizeLobbyCode(code);

  // Once a full code is known, grey out the colours already in that lobby.
  useEffect(() => {
    setTaken([]);
    if (!isValidLobbyCode(cleanCode)) return;
    let cancelled = false;
    void checkLobby(cleanCode, getPlayerId()).then((check) => {
      if (!cancelled && check.status === "exists") {
        setTaken(check.summary.takenColors);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [cleanCode]);

  const colorTaken = color !== null && taken.includes(color);

  const requireName = () => {
    if (cleanName) return true;
    setError("Enter your name first.");
    return false;
  };

  const join = async (target: string) => {
    if (!requireName()) return;
    if (!isValidLobbyCode(target)) {
      setError(`Lobby codes are ${LOBBY_CODE_LENGTH} letters.`);
      return;
    }
    setBusy(true);
    setError(null);
    const check = await checkLobby(target, getPlayerId());
    setBusy(false);
    if (check.status === "missing") setError(`No lobby with code ${target}.`);
    else if (check.status === "unreachable") {
      setError("Can't reach the server.");
    } else if (color && check.summary.takenColors.includes(color)) {
      setTaken(check.summary.takenColors);
      setError("Someone in that lobby has your colour. Pick another.");
    } else onEnter(target, cleanName, color);
  };

  const create = async () => {
    if (!requireName()) return;
    setBusy(true);
    setError(null);
    try {
      onEnter(await createLobby(), cleanName, color);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  const onSubmitJoin = (event: FormEvent) => {
    event.preventDefault();
    void join(cleanCode);
  };

  return (
    <main style={page}>
      <header style={styles.header}>
        <h1 style={styles.title}>Heatshift</h1>
        <p style={help}>
          Secret gear shifts for up to {MAX_PLAYERS} racers, revealed all at
          once.
        </p>
      </header>

      <form onSubmit={onSubmitJoin} style={styles.form}>
        <label style={label}>
          Your name
          <input
            style={input}
            value={name}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="nickname"
            autoFocus={!getSavedName()}
            placeholder="e.g. Alex"
            onChange={(e) => setName(e.target.value)}
          />
        </label>

        <div style={label}>
          Your car colour
          <ColorPicker
            value={colorTaken ? null : color}
            taken={taken}
            onChange={(c) => {
              setColor(c);
              setError(null);
            }}
          />
        </div>

        {invited ? (
          <section style={{ ...panel, ...styles.invite }}>
            <div style={help}>You're invited to lobby</div>
            <div style={styles.inviteCode}>{cleanCode}</div>
            <button type="submit" style={primaryButton} disabled={busy}>
              Join lobby
            </button>
            <button
              type="button"
              style={linkButton}
              onClick={() => {
                setInvited(false);
                setCode("");
              }}
            >
              Use a different code
            </button>
          </section>
        ) : (
          <>
            <button
              type="button"
              style={primaryButton}
              disabled={busy}
              onClick={() => void create()}
            >
              Create a lobby
            </button>

            <div style={styles.divider}>or join one</div>

            <div style={styles.joinRow}>
              <input
                style={{ ...input, ...styles.codeInput }}
                value={code}
                placeholder="CODE"
                aria-label="Lobby code"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                inputMode="text"
                maxLength={LOBBY_CODE_LENGTH + 2}
                onChange={(e) => setCode(normalizeLobbyCode(e.target.value))}
              />
              <button
                type="submit"
                style={{ ...secondaryButton, width: "auto", flex: 1 }}
                disabled={busy || cleanCode.length !== LOBBY_CODE_LENGTH}
              >
                Join
              </button>
            </div>

            {lastLobby && isValidLobbyCode(lastLobby) && (
              <button
                type="button"
                style={linkButton}
                disabled={busy}
                onClick={() => void join(lastLobby)}
              >
                Rejoin lobby {lastLobby}
              </button>
            )}
          </>
        )}

        {error && (
          <p role="alert" style={styles.error}>
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  header: { textAlign: "center", margin: "1.5rem 0 2rem" },
  title: {
    margin: 0,
    fontSize: "2.6rem",
    fontWeight: 900,
    fontStyle: "italic",
    letterSpacing: "-0.02em",
    color: colors.accent,
  },
  form: { display: "flex", flexDirection: "column", gap: "1.1rem" },
  invite: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "0.75rem",
  },
  inviteCode: {
    fontSize: "2.4rem",
    fontWeight: 800,
    letterSpacing: "0.3em",
    marginRight: "-0.3em",
    color: colors.accent,
  },
  divider: {
    textAlign: "center",
    color: colors.faint,
    fontSize: "0.85rem",
    textTransform: "uppercase",
    letterSpacing: "0.08em",
  },
  joinRow: { display: "flex", gap: "0.6rem" },
  codeInput: {
    flex: 1.4,
    textAlign: "center",
    fontWeight: 700,
    letterSpacing: "0.3em",
    textTransform: "uppercase",
  },
  error: { color: colors.heat, margin: 0, textAlign: "center" },
};
