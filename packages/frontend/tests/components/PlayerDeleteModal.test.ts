/**
 * Unit test: PlayerDeleteModal component
 * Verifies confirmation dialog behaviour per T006
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PlayerDeleteModal from "../../src/components/player/PlayerDeleteModal.vue";
import { UModalStub } from "../stubs/nuxt-ui";

const basePlayer = { id: "p-1", firstName: "Diego", lastName: "Martín" };

describe("PlayerDeleteModal", () => {
  it("renders player name in modal body", () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      global: {
        components: {
          UModal: UModalStub,
        },
      },
    });
    expect(wrapper.text()).toContain("Diego Martín");
  });

  it('emits "confirm" event when Confirm Delete button is clicked', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      global: {
        components: {
          UModal: UModalStub,
        },
      },
    });
    await wrapper.find('[data-testid="confirm-confirmation"]').trigger("click");
    expect(wrapper.emitted("confirm")).toBeTruthy();
    expect(wrapper.emitted("confirm")?.length).toBe(1);
  });

  it('emits "cancel" event when Cancel button is clicked', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      global: {
        components: {
          UModal: UModalStub,
        },
      },
    });
    await wrapper.find('[data-testid="cancel-confirmation"]').trigger("click");
    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it('emits "cancel" event on backdrop close', async () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      global: {
        components: {
          UModal: UModalStub,
        },
      },
    });
    await wrapper.find('[data-testid="u-modal-backdrop"]').trigger("click");
    expect(wrapper.emitted("cancel")).toBeTruthy();
  });

  it("shows permanence warning text", () => {
    const wrapper = mount(PlayerDeleteModal, {
      props: { player: basePlayer },
      global: {
        components: {
          UModal: UModalStub,
        },
      },
    });
    // Should warn about the action being irreversible
    expect(wrapper.text().toLowerCase()).toMatch(
      /permanent|irreversible|cannot be undone/i,
    );
  });
});
