import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";
import { nextTick } from "vue";
import ConfirmationModal from "../../src/components/ui/ConfirmationModal.vue";
import { UModalStub } from "../stubs/nuxt-ui";

function factory(overrides = {}) {
  const defaultOnConfirm = vi.fn();
  const defaultOnCancel = vi.fn();
  const onConfirm = overrides.onConfirm ?? defaultOnConfirm;
  const onCancel = overrides.onCancel ?? defaultOnCancel;

  const wrapper = mount(ConfirmationModal, {
    props: {
      open: true,
      title: "Eliminar partido",
      description: "Esta accion no se puede deshacer.",
      onConfirm,
      onCancel,
      ...overrides,
    },
    global: {
      components: {
        UModal: UModalStub,
      },
    },
  });

  return { wrapper, onConfirm, onCancel };
}

describe("ConfirmationModal", () => {
  it("renders when open with provided title and description", () => {
    const { wrapper } = factory();
    expect(wrapper.find('[data-testid="confirmation-modal"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain("Eliminar partido");
    expect(wrapper.text()).toContain("Esta accion no se puede deshacer.");
  });

  it("emits close when cancel button is clicked", async () => {
    const { wrapper, onCancel } = factory();

    await wrapper.find('[data-testid="cancel-confirmation"]').trigger("click");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("emits close when backdrop requests close", async () => {
    const { wrapper, onCancel } = factory();

    await wrapper.find('[data-testid="u-modal-backdrop"]').trigger("click");

    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("closes after successful confirm", async () => {
    const { wrapper, onConfirm } = factory({
      onConfirm: vi.fn().mockResolvedValue(undefined),
    });

    await wrapper.find('[data-testid="confirm-confirmation"]').trigger("click");

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(wrapper.emitted("update:open")).toEqual([[false]]);
  });

  it("shows error and keeps modal open when confirm fails", async () => {
    const error = new Error("Fallo de red");
    const { wrapper } = factory({
      onConfirm: vi.fn().mockRejectedValue(error),
    });

    await wrapper.find('[data-testid="confirm-confirmation"]').trigger("click");
    await nextTick();

    expect(wrapper.emitted("update:open")).toBeUndefined();
    expect(wrapper.text()).toContain("Fallo de red");
  });

  it("disables confirm while async action is running", async () => {
    let resolver = null;
    const pending = new Promise((resolve) => {
      resolver = resolve;
    });

    const { wrapper } = factory({
      onConfirm: vi.fn().mockReturnValue(pending),
    });

    await wrapper.find('[data-testid="confirm-confirmation"]').trigger("click");
    await nextTick();
    expect(
      wrapper
        .find('[data-testid="confirm-confirmation"]')
        .attributes("disabled"),
    ).toBeDefined();

    resolver?.();
    await nextTick();
  });
});
