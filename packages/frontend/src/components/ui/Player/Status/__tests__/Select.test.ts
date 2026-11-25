import { describe, expect, it } from "vitest";
import { mount } from "@vue/test-utils";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import Select from "../Select.vue";

describe("PlayerStatusSelect", () => {
  it("emits selected when Todos is selected", async () => {
    const wrapper = mount(Select, {
      props: { includeAll: true },
    });

    await wrapper.find("select").setValue(OPTION_FILTER_ALL);

    expect(wrapper.emitted("selected")?.[0]).toEqual([OPTION_FILTER_ALL]);
  });
});
