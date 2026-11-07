import { describe, expect, it } from "vitest";
import {
  allowedGears,
  chooseGear,
  clearChoice,
  createLobby,
  joinLobby,
  removePlayer,
  shiftCost,
  setColor,
  spunOut,
  startRound,
  takenColors,
  upgradeLobby,
  viewFor,
  type LobbyState,
} from "../game";
import { MAX_PLAYERS } from "../protocol";

function lobbyWith(...names: string[]): LobbyState {
  const state = createLobby("ABCD");
  for (const name of names) expect(joinLobby(state, name, name)).toBeNull();
  return state;
}

const gearOf = (state: LobbyState, id: string) =>
  state.players.find((p) => p.id === id)!.gear;

describe("shift rules", () => {
  it("is free to shift one gear or stay, costs 1 Heat to skip one", () => {
    expect(shiftCost(2, 2)).toBe(0);
    expect(shiftCost(2, 3)).toBe(0);
    expect(shiftCost(2, 1)).toBe(0);
    expect(shiftCost(1, 3)).toBe(1);
    expect(shiftCost(4, 2)).toBe(1);
    expect(shiftCost(1, 4)).toBeNull();
    expect(shiftCost(4, 1)).toBeNull();
  });

  it("lists the gears reachable from each gear", () => {
    expect(allowedGears(1)).toEqual([1, 2, 3]);
    expect(allowedGears(2)).toEqual([1, 2, 3, 4]);
    expect(allowedGears(4)).toEqual([2, 3, 4]);
  });
});

describe("joining", () => {
  it("starts everyone in 1st gear and caps the lobby at 8", () => {
    const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `p${i}`);
    const state = lobbyWith(...names);
    expect(state.players.every((p) => p.gear === 1)).toBe(true);
    expect(joinLobby(state, "late", "Late")).toMatch(/full/);
    // Someone already in can always rejoin.
    expect(joinLobby(state, "p3", "Renamed")).toBeNull();
    expect(state.players.find((p) => p.id === "p3")!.name).toBe("Renamed");
  });

  it("requires a name", () => {
    expect(joinLobby(createLobby("ABCD"), "x", "   ")).toMatch(/name/);
  });
});

describe("a round", () => {
  it("hides picks until everyone has chosen, then reveals them all", () => {
    const state = lobbyWith("a", "b", "c");
    expect(startRound(state, "a")).toBeNull();
    expect(state.phase).toBe("choosing");

    expect(chooseGear(state, "a", 2)).toBeNull();
    expect(chooseGear(state, "b", 3)).toBeNull();
    expect(state.phase).toBe("choosing");

    const bView = viewFor(state, "b", new Set(["a", "b", "c"]));
    expect(bView.yourChoice).toBe(3);
    expect(JSON.stringify(bView)).not.toContain('"lastReveal":{');
    expect(bView.players.map((p) => p.hasChosen)).toEqual([true, true, false]);
    // b's view says a has chosen but never which gear.
    expect(bView.players[0]).not.toHaveProperty("choice");

    expect(chooseGear(state, "c", 1)).toBeNull();
    expect(state.phase).toBe("revealed");
    expect(state.lastReveal).toEqual({
      round: 1,
      results: [
        { playerId: "a", name: "a", color: "red", from: 1, to: 2, heatCost: 0 },
        {
          playerId: "b",
          name: "b",
          color: "blue",
          from: 1,
          to: 3,
          heatCost: 1,
        },
        {
          playerId: "c",
          name: "c",
          color: "green",
          from: 1,
          to: 1,
          heatCost: 0,
        },
      ],
    });
    expect([gearOf(state, "a"), gearOf(state, "b")]).toEqual([2, 3]);
  });

  it("lets a player change or undo their pick before the reveal", () => {
    const state = lobbyWith("a", "b");
    startRound(state, "b");
    chooseGear(state, "a", 3);
    chooseGear(state, "a", 2);
    expect(state.choices.a).toBe(2);
    clearChoice(state, "a");
    expect(state.choices.a).toBeUndefined();
  });

  it("rejects gears out of reach", () => {
    const state = lobbyWith("a");
    startRound(state, "a");
    expect(chooseGear(state, "a", 4)).toMatch(/1, 2, 3/);
    expect(state.phase).toBe("choosing");
  });

  it("keeps late joiners out until the next round", () => {
    const state = lobbyWith("a");
    startRound(state, "a");
    joinLobby(state, "late", "Late");
    expect(chooseGear(state, "late", 2)).toMatch(/next round/);
    chooseGear(state, "a", 2);
    expect(state.phase).toBe("revealed");
    startRound(state, "late");
    expect(state.inRound).toEqual(["a", "late"]);
  });

  it("doesn't let a second round start over one in progress", () => {
    const state = lobbyWith("a", "b");
    startRound(state, "a");
    expect(startRound(state, "b")).toMatch(/already/);
    expect(state.round).toBe(1);
  });

  it("reveals when the last undecided player is removed", () => {
    const state = lobbyWith("a", "b");
    startRound(state, "a");
    chooseGear(state, "a", 2);
    removePlayer(state, "b");
    expect(state.phase).toBe("revealed");
    expect(state.lastReveal!.results.map((r) => r.playerId)).toEqual(["a"]);
  });

  it("drops a spun-out car to 1st gear, but not mid-choice", () => {
    const state = lobbyWith("a");
    startRound(state, "a");
    chooseGear(state, "a", 3);
    expect(gearOf(state, "a")).toBe(3);
    startRound(state, "a");
    expect(spunOut(state, "a")).toMatch(/reveal/);
    chooseGear(state, "a", 4);
    expect(spunOut(state, "a")).toBeNull();
    expect(gearOf(state, "a")).toBe(1);
  });
});

describe("car colours", () => {
  it("gives each player their preferred colour if free, else the first free one", () => {
    const state = createLobby("ABCD");
    joinLobby(state, "a", "A", "yellow");
    joinLobby(state, "b", "B", "yellow");
    joinLobby(state, "c", "C");
    expect(state.players.map((p) => p.color)).toEqual([
      "yellow",
      "red",
      "blue",
    ]);
  });

  it("gives all 8 players a distinct colour", () => {
    const names = Array.from({ length: MAX_PLAYERS }, (_, i) => `p${i}`);
    const state = lobbyWith(...names);
    expect(new Set(state.players.map((p) => p.color)).size).toBe(MAX_PLAYERS);
  });

  it("only lets you change to a colour nobody else has", () => {
    const state = createLobby("ABCD");
    joinLobby(state, "a", "A", "black");
    joinLobby(state, "b", "B", "white");
    expect(setColor(state, "b", "black")).toMatch(/already/);
    expect(setColor(state, "b", "green")).toBeNull();
    expect(setColor(state, "b", "green")).toBeNull();
    expect(takenColors(state, "a")).toEqual(["green"]);
  });

  it("keeps your colour when rejoining, unless you ask for a free one", () => {
    const state = createLobby("ABCD");
    joinLobby(state, "a", "A", "red");
    joinLobby(state, "b", "B", "blue");
    joinLobby(state, "a", "A", "blue");
    expect(state.players[0].color).toBe("red");
    joinLobby(state, "a", "A", "purple");
    expect(state.players[0].color).toBe("purple");
  });

  it("assigns colours to lobbies saved before colours existed", () => {
    const state = createLobby("ABCD");
    state.players = [
      { id: "a", name: "A", gear: 1 },
      { id: "b", name: "B", gear: 2 },
    ] as unknown as LobbyState["players"];
    upgradeLobby(state);
    expect(state.players.map((p) => p.color)).toEqual(["red", "blue"]);
  });
});
