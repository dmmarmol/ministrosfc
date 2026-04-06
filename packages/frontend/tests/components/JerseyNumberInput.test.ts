import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import JerseyNumberInput from "../../src/components/ui/JerseyNumberInput.vue";

describe("JerseyNumberInput", () => {
  const mountComponent = (props = {}) =>
    mount(JerseyNumberInput, {
      props: {
        modelValue: null,
        takenNumbers: [],
        ...props,
      },
    });

  it("renders a number input", () => {
    const wrapper = mountComponent();
    const input = wrapper.find("input[type='number']");
    expect(input.exists()).toBe(true);
  });

  it("shows available ranges hint when there are taken numbers", () => {
    const wrapper = mountComponent({ takenNumbers: [2, 3], modelValue: null });
    const hint = wrapper.find("[data-testid='jersey-available-hint']");
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain("Disponibles:");
    expect(hint.text()).toContain("1");
  });

  it("shows error message when current value is in takenNumbers", () => {
    const wrapper = mountComponent({ takenNumbers: [5, 10], modelValue: 5 });
    const error = wrapper.find("[data-testid='jersey-taken-error']");
    expect(error.exists()).toBe(true);
    expect(error.text()).toBe("Este número ya está ocupado");
  });

  it("does not show error when value is not in takenNumbers", () => {
    const wrapper = mountComponent({ takenNumbers: [5, 10], modelValue: 7 });
    expect(wrapper.find("[data-testid='jersey-taken-error']").exists()).toBe(
      false,
    );
  });

  it("emits update:modelValue with parsed number on input", async () => {
    const wrapper = mountComponent({ modelValue: null, takenNumbers: [] });
    const input = wrapper.find("input");
    await input.setValue("11");
    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted).toBeTruthy();
    expect(emitted![0]).toEqual([11]);
  });

  it("emits null when input is cleared", async () => {
    const wrapper = mountComponent({ modelValue: 10, takenNumbers: [] });
    const input = wrapper.find("input");
    await input.setValue("");
    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted![0]).toEqual([null]);
  });

  it("handles empty taken list — shows all available as hint", () => {
    const wrapper = mountComponent({ takenNumbers: [], modelValue: null });
    const hint = wrapper.find("[data-testid='jersey-available-hint']");
    expect(hint.exists()).toBe(true);
    expect(hint.text()).toContain("1-99");
    expect(wrapper.find("[data-testid='jersey-taken-error']").exists()).toBe(
      false,
    );
  });

  it("disables the input when disabled prop is true", () => {
    const wrapper = mountComponent({ disabled: true });
    const input = wrapper.find("input");
    expect((input.element as HTMLInputElement).disabled).toBe(true);
  });
});
