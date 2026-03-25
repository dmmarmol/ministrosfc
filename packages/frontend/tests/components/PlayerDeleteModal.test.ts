/**
 * Unit test: PlayerDeleteModal component
 * Verifies confirmation dialog behaviour per T006
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PlayerDeleteModal from "../../src/components/player/PlayerDeleteModal.vue";

const basePlayer = { id: "p-1", name: "Diego Martín" };

describe("PlayerDeleteModal", () => {
  it("renders player name in modal body", () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
    });
    expect(wrapper.text()).toContain("Diego Martín");
  });

  it('emits "confirm" event when Confirm Delete button is clicked', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
    });
    await wrapper.find('[data-testid="confirm-delete"]').trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
    expect(wrapper.emitted("confirm")!.length).toBe(1);
  });

  it('emits "cancel" event when Cancel button is clicked', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
    });
    await wrapper.find('[data-testid="cancel-delete"]').trigger("click");
    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it('emits "cancel" event on Escape keydown', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      attachTo: document.body,
    });
    await wrapper.trigger("keydown", { key: "Escape" });
    expect(wrapper.emitted("cancel")).toBeTruthy();
    wrapper.unmount();
  });

  it("shows permanence warning text", () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
    });
    // Should warn about the action being irreversible
    expect(wrapper.text().toLowerCase()).toMatch(/permanent|irreversible|cannot be undone/i);
  });
});
