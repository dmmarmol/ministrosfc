import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

// ------------------------------------------------------------------
// Mock nuxt/app before importing the component
// ------------------------------------------------------------------
const mockApi = vi.fn();

vi.mock("nuxt/app", () => ({
  useNuxtApp: () => ({ $api: mockApi }),
}));

// Stub DropdownAddMore — use require('vue') inside factory (hoisting-safe)
vi.mock("~/components/ui/DropdownAddMore.vue", () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { defineComponent } = require("vue");
  return {
    default: defineComponent({
      name: "DropdownAddMore",
      props: [
        "modelValue",
        "options",
        "loading",
        "disabled",
        "onCreate",
        "labels",
      ],
      emits: ["update:modelValue", "select"],
      template: `<div data-testid="dropdown-stub">
        <button
          v-for="opt in options"
          :key="opt.id"
          :data-option-id="opt.id"
          @click="$emit('select', opt)"
        >{{ opt.label }}</button>
      </div>`,
    }),
  };
});

// Import AFTER mocks are wired
const { default: SignupAddPlayer } = await import("../SignupAddPlayer.vue");

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------
const PLAYERS = [
  { id: "p1", firstName: "Carlos", lastName: "López", position: null },
  { id: "p2", firstName: "Fabio", lastName: "García", position: null },
  { id: "p3", firstName: "Andrés", lastName: "Ruiz", position: null },
];

function makeWrapper(overrides: Record<string, unknown> = {}) {
  return mount(SignupAddPlayer, {
    props: {
      confirmedPlayerIds: [],
      proxyLoading: false,
      proxyError: null,
      isFull: false,
      ...overrides,
    },
  });
}

// ------------------------------------------------------------------
// Tests
// ------------------------------------------------------------------
describe("SignupAddPlayer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: API returns all 3 players
    mockApi.mockResolvedValue({ data: PLAYERS });
  });

  // 1. Dropdown renders only non-confirmed registered active players
  it("passes only non-confirmed players as dropdown options", async () => {
    const wrapper = makeWrapper({ confirmedPlayerIds: ["p1"] });
    await flushPromises();

    const stub = wrapper.findComponent({ name: "DropdownAddMore" });
    const options = stub.props("options") as { id: string }[];
    const ids = options.map((o) => o.id);
    expect(ids).not.toContain("p1");
    expect(ids).toContain("p2");
    expect(ids).toContain("p3");
  });

  // 2. Selecting a player emits signup-proxy with the player's ID
  it("emits signup-proxy with playerId when a player is selected from the dropdown", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    const stub = wrapper.findComponent({ name: "DropdownAddMore" });
    await stub.vm.$emit("select", { id: "p2", label: "Fabio García" });

    expect(wrapper.emitted("signup-proxy")).toEqual([["p2"]]);
  });

  // 3. Clicking "Agregar invitado" shows guest form and hides dropdown
  it("switches to guest form when 'Agregar invitado' is clicked, hiding the dropdown", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(false);

    const addGuestBtn = wrapper.find('[data-testid="open-guest-form"]');
    await addGuestBtn.trigger("click");

    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(true);
  });

  // 4. × closes guest form without emitting, restoring dropdown
  it("closes guest form and restores dropdown when × is clicked, without emitting signup-guest", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    // Open guest form
    await wrapper.find('[data-testid="open-guest-form"]').trigger("click");
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(true);

    // Click × dismiss
    await wrapper.find('[data-testid="dismiss-guest"]').trigger("click");

    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(true);
    expect(wrapper.emitted("signup-guest")).toBeUndefined();
  });

  // 5. Valid guest form submission emits signup-guest with correct args
  it("emits signup-guest with firstName, lastName, and position on valid form submission", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    await wrapper.find('[data-testid="open-guest-form"]').trigger("click");

    await wrapper.find('[data-testid="guest-first"]').setValue("Juan");
    await wrapper.find('[data-testid="guest-last"]').setValue("Pérez");
    await wrapper.find('[data-testid="guest-position"]').setValue("CF");
    await wrapper.find('[data-testid="guest-submit"]').trigger("click");

    expect(wrapper.emitted("signup-guest")).toEqual([["Juan", "Pérez", "CF"]]);
  });

  // 5b. Guest submission with no position passes null
  it("emits signup-guest with null position when no position is selected", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    await wrapper.find('[data-testid="open-guest-form"]').trigger("click");
    await wrapper.find('[data-testid="guest-first"]').setValue("Ana");
    await wrapper.find('[data-testid="guest-last"]').setValue("Gómez");
    await wrapper.find('[data-testid="guest-submit"]').trigger("click");

    expect(wrapper.emitted("signup-guest")).toEqual([["Ana", "Gómez", null]]);
  });

  // 6 + 7. Widget renders nothing when isFull=true
  it("renders nothing when isFull is true (game at capacity)", () => {
    const wrapper = makeWrapper({ isFull: true });
    // The root v-if="!isFull" means no content
    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="open-guest-form"]').exists()).toBe(
      false,
    );
  });

  // Mutual exclusion: dropdown and guest form never visible simultaneously
  it("never shows dropdown and guest form at the same time", async () => {
    const wrapper = makeWrapper();
    await flushPromises();

    // Default: dropdown visible, guest form hidden
    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(false);

    // After opening guest form: dropdown hidden, form visible
    await wrapper.find('[data-testid="open-guest-form"]').trigger("click");
    expect(wrapper.find('[data-testid="dropdown-stub"]').exists()).toBe(false);
    expect(wrapper.find('[data-testid="guest-form"]').exists()).toBe(true);
  });
});
