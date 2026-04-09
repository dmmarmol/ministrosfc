import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));
vi.stubGlobal("$fetch", vi.fn());

import ProfileEditForm from "../../src/components/profile/ProfileEditForm.vue";

// Minimal functional stubs that prevent child-component network calls and leak
// timers from hanging the test runner (AddressAutocompleteInput calls
// useRuntimeConfig at setup time and has an uncleaned debounce timer).
const stubJerseyNumber = {
  props: ["modelValue", "takenNumbers", "disabled"],
  emits: ["update:modelValue"],
  template: `
    <div>
      <input
        id="jerseyNumberInput"
        :value="modelValue ?? ''"
        type="number"
        @input="$emit('update:modelValue', $event.target.value === '' ? null : Number($event.target.value))"
      />
      <p v-if="takenNumbers && takenNumbers.includes(modelValue)" data-testid="jersey-taken-error">
        Este número ya está ocupado
      </p>
      <p v-else-if="takenNumbers && takenNumbers.length > 0" data-testid="jersey-available-hint">
        Disponibles
      </p>
    </div>
  `,
};

const stubIsPlayerCheckbox = {
  props: ["modelValue", "id", "label", "description"],
  emits: ["update:modelValue"],
  template: `<input :id="id" type="checkbox" :checked="modelValue" @change="$emit('update:modelValue', $event.target.checked)" />`,
};

const stubAddressAutocomplete = {
  props: ["modelValue", "id", "placeholder", "required"],
  emits: ["update:modelValue", "select"],
  template: `<input :id="id" :value="modelValue" @input="$emit('update:modelValue', $event.target.value)" />`,
};

describe("ProfileEditForm", () => {
  /** @TODO reuse an existing interface to type defaultProfile */
  const defaultProfile = {
    firstName: "Juan",
    lastName: "Pérez",
    nickname: "Juanchi",
    position: "CMF",
    jerseyNumber: 10,
    dateOfBirth: "1990-05-15",
    address: "Av. Corrientes 1234",
    phone: "+54 11 1234-5678",
    whatsapp: "+54 11 1234-5678",
    emergencyContact: "María Pérez",
    status: "ACTIVE",
  };

  const mountForm = (props = {}) =>
    mount(ProfileEditForm, {
      props: {
        profile: defaultProfile,
        takenJerseys: [1, 2, 3, 5],
        loading: false,
        error: "",
        ...props,
      },
      global: {
        stubs: {
          JerseyNumberInput: stubJerseyNumber,
          IsPlayerCheckbox: stubIsPlayerCheckbox,
          AddressAutocompleteInput: stubAddressAutocomplete,
        },
      },
    });

  it("renders all editable fields", () => {
    const wrapper = mountForm();
    expect(wrapper.find("#profile-firstName").exists()).toBe(true);
    expect(wrapper.find("#profile-lastName").exists()).toBe(true);
    expect(wrapper.find("#profile-nickname").exists()).toBe(true);
    expect(wrapper.find("#profile-position").exists()).toBe(true);
    expect(wrapper.find("#jerseyNumberInput").exists()).toBe(true);
    expect(wrapper.find("#profile-dateOfBirth").exists()).toBe(true);
    expect(wrapper.find("#profile-address").exists()).toBe(true);
    expect(wrapper.find("#profile-phone").exists()).toBe(true);
    expect(wrapper.find("#profile-whatsapp").exists()).toBe(true);
    expect(wrapper.find("#profile-emergencyContact").exists()).toBe(true);
    expect(wrapper.find("#profileStatus").exists()).toBe(true);
  });

  it("populates fields from profile prop", () => {
    const wrapper = mountForm();
    expect(
      (wrapper.find("#profile-firstName").element as HTMLInputElement).value,
    ).toBe("Juan");
    expect(
      (wrapper.find("#profile-lastName").element as HTMLInputElement).value,
    ).toBe("Pérez");
  });

  it("emits save with form data on submit", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profile-nickname").setValue("Carlitos");
    await wrapper.find("form").trigger("submit.prevent");

    expect(wrapper.emitted("save")).toBeTruthy();
    const emitted = wrapper.emitted("save")![0][0] as any;
    expect(emitted.nickname).toBe("Carlitos");
  });

  it("shows jersey available ranges hint", () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, jerseyNumber: null },
      takenJerseys: [7, 10],
    });
    const hint = wrapper.find("[data-testid='jersey-available-hint']");
    expect(hint.exists()).toBe(true);
    // Available ranges should exclude 7 and 10
    expect(hint.text()).not.toContain("7");
  });

  it("shows loading state", () => {
    const wrapper = mountForm({ loading: true });
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes("disabled")).toBeDefined();
  });

  it("shows error message", () => {
    const wrapper = mountForm({ error: "Error al guardar" });
    expect(wrapper.text()).toContain("Error al guardar");
  });

  it("renders IsPlayerCheckbox checked when status is ACTIVE", () => {
    const wrapper = mountForm();
    const checkbox = wrapper.find("#profileStatus");
    expect((checkbox.element as HTMLInputElement).checked).toBe(true);
  });

  it("emits save with status INACTIVE when IsPlayerCheckbox is unchecked", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profileStatus").setValue(false);
    await wrapper.find("form").trigger("submit.prevent");
    const emitted = wrapper.emitted("save")![0][0] as any;
    expect(emitted.status).toBe("INACTIVE");
  });

  // EC-1: deep watch on profile prop re-syncs form fields after mount
  it("re-syncs form fields when profile prop changes after mount", async () => {
    const wrapper = mountForm();
    await wrapper.setProps({
      profile: { ...defaultProfile, firstName: "Carlos", nickname: "Carlitos" },
    });
    expect(
      (wrapper.find("#profile-firstName").element as HTMLInputElement).value,
    ).toBe("Carlos");
    expect(
      (wrapper.find("#profile-nickname").element as HTMLInputElement).value,
    ).toBe("Carlitos");
  });

  // EC-2: submit button disabled when the jersey number is already taken
  it("disables submit button when selected jersey is taken", () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, jerseyNumber: 3 },
      takenJerseys: [3, 7],
    });
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes("disabled")).toBeDefined();
  });

  // EC-3: empty position string is submitted as null
  it("emits save with position null when no position is selected", async () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, position: "" },
    });
    await wrapper.find("form").trigger("submit.prevent");
    const emitted = wrapper.emitted("save")![0][0] as any;
    expect(emitted.position).toBeNull();
  });

  // EC-4: lastNameChange emit fires on last name input events
  it("emits lastNameChange when last name input changes", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profile-lastName").setValue("López");
    expect(wrapper.emitted("lastNameChange")).toBeTruthy();
    expect(wrapper.emitted("lastNameChange")![0][0]).toBe("López");
  });

  // EC-5: inactive warning banner visibility tracks status
  it("shows inactive warning when status is INACTIVE", async () => {
    const wrapper = mountForm();
    await wrapper.find("#profileStatus").setValue(false);
    expect(wrapper.find(".border-yellow-300").exists()).toBe(true);
  });

  it("hides inactive warning when status is ACTIVE", () => {
    const wrapper = mountForm();
    expect(wrapper.find(".border-yellow-300").exists()).toBe(false);
  });

  // EC-6: no error element rendered when error prop is empty
  it("does not render error element when error prop is empty string", () => {
    const wrapper = mountForm({ error: "" });
    expect(wrapper.find(".text-red-600").exists()).toBe(false);
  });

  // NC-1: jerseyChange emit fires when jersey number changes
  it("emits jerseyChange when jersey number is updated", async () => {
    const wrapper = mountForm();
    const jerseyInput = wrapper.find("#jerseyNumberInput");
    await jerseyInput.setValue(9);
    expect(wrapper.emitted("jerseyChange")).toBeTruthy();
  });

  // NC-2: button label text is "Guardando…" when loading is true
  it("shows 'Guardando…' label on submit button when loading", () => {
    const wrapper = mountForm({ loading: true });
    const button = wrapper.find('button[type="submit"]');
    expect(button.text()).toBe("Guardando…");
  });

  // NC-3: null jerseyNumber does NOT disable the submit button
  it("does not disable submit button when jerseyNumber is null", () => {
    const wrapper = mountForm({
      profile: { ...defaultProfile, jerseyNumber: null },
    });
    const button = wrapper.find('button[type="submit"]');
    expect(button.attributes("disabled")).toBeUndefined();
  });

  // NC-4: null optional fields initialise as empty string in the form
  it("initialises null optional fields as empty strings", () => {
    const wrapper = mountForm({
      profile: {
        ...defaultProfile,
        nickname: null as any,
        address: null as any,
        phone: null as any,
        whatsapp: null as any,
        emergencyContact: null as any,
      },
    });
    expect(
      (wrapper.find("#profile-nickname").element as HTMLInputElement).value,
    ).toBe("");
    expect(
      (wrapper.find("#profile-phone").element as HTMLInputElement).value,
    ).toBe("");
    expect(
      (wrapper.find("#profile-emergencyContact").element as HTMLInputElement)
        .value,
    ).toBe("");
  });
});
