import { describe, expect, it } from "vitest";
import { CompetitionType } from "@ministrosfc/shared";
import TournamentCompetitionType from "../TournamentCompetitionType.vue";
import { mount } from "@vue/test-utils";

describe("TournamentCompetitionType", () => {
  it.each([
    [CompetitionType.FRIENDLY, "Amistoso"],
    [CompetitionType.LEAGUE, "Liga"],
    [CompetitionType.CUP, "Copa"],
    [CompetitionType.PLAYOFF, "Eliminatoria"],
  ])("labels %s in Spanish", (type, label) => {
    const wrapper = mount(TournamentCompetitionType, {
      props: { type },
    });

    expect(wrapper.text()).toContain(label);
  });

  it.each([null, "UNKNOWN"])(
    "uses a safe fallback for missing or unknown values",
    (type) => {
      const wrapper = mount(TournamentCompetitionType, {
        props: { type },
      });

      expect(wrapper.text()).toBe("Sin tipo");
    },
  );
});
