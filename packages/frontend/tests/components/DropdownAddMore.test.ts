/**
 * Unit tests for DropdownAddMore component
 *
 * T006  [US1] Basic select behaviour
 * T006B [US1] Missing-value fallback
 * T009  [US2] Inline creation flow
 * T016  [US3] Search/filter behaviour
 * T019  [US4] Loading / empty / error states
 *
 * Strategy: mock vue-select module so the stub always renders all named slots
 * inline. Tests focus on OUR wrapper logic (props forwarding, emit wiring,
 * creation flow) and not on vue-select's teleportation / dropdown-open state.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

// vi.mock is hoisted before any imports / variable declarations. The factory
// uses a dynamic import to get Vue helpers at evaluation time.
vi.mock("vue-select", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    default: defineComponent({
      name: "VSelect",
      props: [
        "modelValue",
        "options",
        "loading",
        "searchable",
        "disabled",
        "placeholder",
        "clearable",
        "deselectFromDropdown",
        "appendToBody",
        "label",
        "reduce",
      ],
      emits: ["option:selected", "update:modelValue"],
      setup(_props, { slots }) {
        return () =>
          h("div", { class: "v-select-stub" }, [
            slots["no-options"]?.({ search: "" }) ?? null,
            slots["list-footer"]?.() ?? null,
          ]);
      },
    }),
  };
});

// Import after mock so VSelect === the stub definition above.
import VSelect from "vue-select";
import DropdownAddMore from "../../src/components/ui/DropdownAddMore.vue";
import type { DropdownOption } from "../../src/components/ui/DropdownAddMore.vue";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------
const OPTIONS: DropdownOption[] = [
  { id: "pg-1", label: "Alpha Cancha" },
  { id: "pg-2", label: "Beta Cancha" },
  { id: "pg-3", label: "Gamma Cancha" },
];

const noop = vi
  .fn()
  .mockResolvedValue({ id: "new-1", label: "Nueva" } as DropdownOption);

function mountDropdown(props: Record<string, unknown> = {}) {
  return mount(DropdownAddMore, {
    props: { modelValue: null, options: OPTIONS, onCreate: noop, ...props },
  });
}

// ---------------------------------------------------------------------------
// T006 — User Story 1: Select from existing options
// ---------------------------------------------------------------------------
describe("T006 — US1: Select from existing options", () => {
  beforeEach(() => vi.clearAllMocks());

  it("passes the resolved option object as modelValue to VSelect when an id matches", () => {
    const wrapper = mountDropdown({ modelValue: "pg-1" });
    const mv = wrapper
      .findComponent(VSelect)
      .props("modelValue") as DropdownOption | null;
    expect(mv).not.toBeNull();
    expect((mv as DropdownOption).label).toBe("Alpha Cancha");
  });

  it("passes all options to VSelect", () => {
    const wrapper = mountDropdown();
    const opts = wrapper
      .findComponent(VSelect)
      .props("options") as DropdownOption[];
    expect(opts).toHaveLength(3);
    expect(opts.map((o: DropdownOption) => o.id)).toEqual([
      "pg-1",
      "pg-2",
      "pg-3",
    ]);
  });

  it("emits update:modelValue with the option id when option:selected fires", async () => {
    const wrapper = mountDropdown();
    await wrapper
      .findComponent(VSelect)
      .vm.$emit("option:selected", { id: "pg-2", label: "Beta Cancha" });
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["pg-2"]);
  });

  it("emits select with the full DropdownOption when option:selected fires", async () => {
    const wrapper = mountDropdown();
    await wrapper
      .findComponent(VSelect)
      .vm.$emit("option:selected", { id: "pg-2", label: "Beta Cancha" });
    expect(wrapper.emitted("select")![0]).toEqual([
      { id: "pg-2", label: "Beta Cancha" },
    ]);
  });

  it("passes clearable: false to VSelect", () => {
    expect(mountDropdown().findComponent(VSelect).props("clearable")).toBe(
      false,
    );
  });

  it("passes deselectFromDropdown: false to VSelect", () => {
    expect(
      mountDropdown().findComponent(VSelect).props("deselectFromDropdown"),
    ).toBe(false);
  });

  it("passes disabled: true to VSelect when disabled prop is set", () => {
    expect(
      mountDropdown({ disabled: true })
        .findComponent(VSelect)
        .props("disabled"),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T006B — User Story 1: Missing-value fallback
// ---------------------------------------------------------------------------
describe("T006B — US1: Missing-value fallback", () => {
  it("does not crash when modelValue references an id absent from options", () => {
    expect(() => mountDropdown({ modelValue: "nonexistent-id" })).not.toThrow();
  });

  it("passes null as modelValue to VSelect when the id is absent from options", () => {
    const wrapper = mountDropdown({ modelValue: "nonexistent-id" });
    expect(wrapper.findComponent(VSelect).props("modelValue")).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// T009 — User Story 2: Add new entry inline
// ---------------------------------------------------------------------------
describe("T009 — US2: Inline creation flow", () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the "Agregar nueva..." button in the list-footer slot by default', () => {
    const wrapper = mountDropdown();
    const btn = wrapper.find(".vs__add-new-btn");
    expect(btn.exists()).toBe(true);
    expect(btn.text()).toBe("Agregar nueva...");
  });

  it('clicking "Agregar nueva..." shows the inline-create slot and hides the button', async () => {
    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate: noop },
      slots: { "inline-create": '<div data-testid="create-form">form</div>' },
    });

    expect(wrapper.find('[data-testid="create-form"]').exists()).toBe(false);
    await wrapper.find(".vs__add-new-btn").trigger("click");
    expect(wrapper.find('[data-testid="create-form"]').exists()).toBe(true);
    expect(wrapper.find(".vs__add-new-btn").exists()).toBe(false);
  });

  it("inline-create slot receives submit, cancel, error, loading props", async () => {
    const received: Record<string, unknown> = {};

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate: noop },
      slots: {
        "inline-create": (sp: Record<string, unknown>) => {
          Object.assign(received, sp);
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");

    expect(typeof received.submit).toBe("function");
    expect(typeof received.cancel).toBe("function");
    expect("error" in received).toBe(true);
    expect("loading" in received).toBe(true);
  });

  it("calling submit(payload) invokes onCreate with that payload", async () => {
    const onCreate = vi.fn().mockResolvedValue({ id: "new-1", label: "Nueva" });
    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: { submit: typeof capturedSubmit }) => {
          capturedSubmit = sp.submit;
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await capturedSubmit({ name: "Nueva" });

    expect(onCreate).toHaveBeenCalledWith({ name: "Nueva" });
  });

  it("on onCreate resolve: new option is appended and update:modelValue emits new id", async () => {
    const newOpt: DropdownOption = { id: "new-1", label: "Nueva Cancha" };
    const onCreate = vi.fn().mockResolvedValue(newOpt);
    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: { submit: typeof capturedSubmit }) => {
          capturedSubmit = sp.submit;
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await capturedSubmit({ name: "Nueva Cancha" });
    await flushPromises();

    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["new-1"]);
    expect(wrapper.emitted("select")![0]).toEqual([newOpt]);

    const opts = wrapper
      .findComponent(VSelect)
      .props("options") as DropdownOption[];
    expect(opts.some((o: DropdownOption) => o.id === "new-1")).toBe(true);
  });

  it("on onCreate reject: error slot prop is set and mini-form remains visible", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("Server error"));
    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;
    let lastError: string | null = null;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: {
          submit: typeof capturedSubmit;
          error: string | null;
        }) => {
          capturedSubmit = sp.submit;
          lastError = sp.error;
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await capturedSubmit({ name: "Bad" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(wrapper.find(".vs__add-new-btn").exists()).toBe(false);
    expect(lastError).toBe("Server error");
  });

  it("calling cancel() closes the mini-form without invoking onCreate", async () => {
    let capturedCancel!: () => void;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate: noop },
      slots: {
        "inline-create": (sp: { cancel: () => void }) => {
          capturedCancel = sp.cancel;
          return "";
        },
      },
    });

    // Before click: "Agregar nueva..." button is visible
    expect(wrapper.find(".vs__add-new-btn").exists()).toBe(true);

    await wrapper.find(".vs__add-new-btn").trigger("click");
    // After click: button disappears (open_create = true, inline-create slot shown)
    expect(wrapper.find(".vs__add-new-btn").exists()).toBe(false);

    capturedCancel();
    await wrapper.vm.$nextTick();

    // After cancel: button reappears (open_create = false)
    expect(wrapper.find(".vs__add-new-btn").exists()).toBe(true);
    expect(noop).not.toHaveBeenCalled();
  });

  it("loading slot prop is true while onCreate is in flight", async () => {
    let resolveCreate!: (v: DropdownOption) => void;
    const onCreate = vi.fn(
      () =>
        new Promise<DropdownOption>((res) => {
          resolveCreate = res;
        }),
    );
    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;
    const loadingValues: boolean[] = [];

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: {
          submit: typeof capturedSubmit;
          loading: boolean;
        }) => {
          capturedSubmit = sp.submit;
          loadingValues.push(sp.loading);
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await wrapper.vm.$nextTick();

    capturedSubmit({ name: "Test" }); // intentionally not awaited
    await wrapper.vm.$nextTick();

    resolveCreate({ id: "new-1", label: "New" });
    await flushPromises();

    expect(loadingValues).toContain(true);
  });
});

// ---------------------------------------------------------------------------
// T016 — User Story 3: Search/filter
// ---------------------------------------------------------------------------
describe("T016 — US3: Search/filter options", () => {
  it("passes searchable: true (default) to VSelect", () => {
    expect(mountDropdown().findComponent(VSelect).props("searchable")).toBe(
      true,
    );
  });

  it("passes searchable: false when prop is explicitly set", () => {
    expect(
      mountDropdown({ searchable: false })
        .findComponent(VSelect)
        .props("searchable"),
    ).toBe(false);
  });

  it('renders "Agregar nueva..." button even when options array is empty', () => {
    expect(
      mountDropdown({ options: [] }).find(".vs__add-new-btn").exists(),
    ).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// T019 — User Story 4: Loading / empty / error states
// ---------------------------------------------------------------------------
describe("T019 — US4: Loading, empty, and error states", () => {
  it("passes loading: true to VSelect", () => {
    expect(
      mountDropdown({ loading: true }).findComponent(VSelect).props("loading"),
    ).toBe(true);
  });

  it("passes loading: false (default) to VSelect", () => {
    expect(mountDropdown().findComponent(VSelect).props("loading")).toBe(false);
  });

  it("after failed onCreate, error slot prop contains the error message", async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error("Bad request"));
    let lastError: string | null = null;
    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: {
          submit: typeof capturedSubmit;
          error: string | null;
        }) => {
          capturedSubmit = sp.submit;
          lastError = sp.error;
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await capturedSubmit({ name: "Fail" });
    await flushPromises();
    await wrapper.vm.$nextTick();

    expect(lastError).toBe("Bad request");
  });

  it("after a successful second submit, update:modelValue fires with the new id", async () => {
    const onCreate = vi
      .fn()
      .mockRejectedValueOnce(new Error("First fail"))
      .mockResolvedValueOnce({ id: "new-1", label: "Ok" });

    let capturedSubmit!: (p: Record<string, unknown>) => Promise<void>;

    const wrapper = mount(DropdownAddMore, {
      props: { modelValue: null, options: OPTIONS, onCreate },
      slots: {
        "inline-create": (sp: { submit: typeof capturedSubmit }) => {
          capturedSubmit = sp.submit;
          return "<div />";
        },
      },
    });

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await capturedSubmit({ name: "Fail" });
    await flushPromises();
    await capturedSubmit({ name: "Ok" });
    await flushPromises();

    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["new-1"]);
  });
});
