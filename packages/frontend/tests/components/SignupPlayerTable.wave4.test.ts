import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import SignupPlayerTable from "../../src/components/pages/games/signup/SignupPlayerTable.vue";
import {
  ConfirmationStatus,
  Position,
  type RosterEntry,
} from "@ministrosfc/shared";

const roster: RosterEntry[] = [
  {
    participantId: "p-1",
    confirmationStatus: ConfirmationStatus.CONFIRMED,
    confirmedById: null,
    confirmedByName: null,
    confirmedAt: new Date().toISOString(),
    player: {
      id: "player-1",
      firstName: "Juan",
      lastName: "Perez",
      jerseyNumber: 10,
      position: Position.CF,
      playerType: "REGISTERED",
      invitedById: null,
      invitedByName: null,
    },
  },
];

describe("SignupPlayerTable Wave 4 header", () => {
  const globalStubs = {
    UiPositionLabel: {
      props: ["position"],
      template: '<span data-testid="position">{{ position || "-" }}</span>',
    },
    UiPositionNumber: {
      props: ["position"],
      template:
        '<span data-testid="position-number">{{ position || "-" }}</span>',
    },
  };

  it('shows "Confirmados (X/Y)" and full indicator when confirmedCount >= maxPlayers', () => {
    const wrapper = mount(SignupPlayerTable, {
      props: {
        roster,
        confirmedCount: 2,
        maxPlayers: 2,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Confirmados (2 / 2)");
    expect(wrapper.text()).toContain("Equipo completo");
    expect(wrapper.find(".text-green-600 svg.w-5.h-5").exists()).toBe(true);
  });

  it('shows "Confirmados (X)" and hides full indicator when maxPlayers is null', () => {
    const wrapper = mount(SignupPlayerTable, {
      props: {
        roster,
        confirmedCount: 2,
        maxPlayers: null,
      },
      global: { stubs: globalStubs },
    });

    expect(wrapper.text()).toContain("Confirmados (2)");
    expect(wrapper.text()).not.toContain("Equipo completo");
  });
});
