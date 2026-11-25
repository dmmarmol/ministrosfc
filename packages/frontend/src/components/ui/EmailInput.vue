<script setup lang="ts">
import { ref, computed } from "vue";
import { isValidEmail } from "@ministrosfc/shared";


const { t } = useI18n();
const props = withDefaults(
  defineProps<{
    modelValue: string;
    id?: string;
    autocomplete?: string;
    required?: boolean;
    disabled?: boolean;
  }>(),
  {
    id: "email",
    autocomplete: "email",
    required: false,
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
  blur: [];
}>();

const touched = ref(false);

const error = computed(() =>
  touched.value &&
  props.modelValue.length > 0 &&
  !isValidEmail(props.modelValue)
    ? t("emailInput.ingresaUnCorreoElectronico")
    : "",
);

const hasError = computed(() => !!error.value);

function onBlur() {
  touched.value = true;
  emit("blur");
}

/** Call this to force validation (e.g. on form submit). Returns true when valid. */
function validate(): boolean {
  touched.value = true;
  return isValidEmail(props.modelValue);
}

defineExpose({ validate, hasError });
</script>

<template>
  <div>
    <input
      :id="id"
      :value="modelValue"
      type="email"
      :autocomplete="autocomplete"
      :required="required"
      :disabled="disabled"
      class="sheet-field mt-1"
      :aria-invalid="hasError ? 'true' : undefined"
      :placeholder="t('emailInput.tuEjemploCom')"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
      @blur="onBlur"
    />
    <p
      v-if="hasError"
      class="sheet-error-text mt-1"
      data-testid="email-error"
    >
      {{ error }}
    </p>
  </div>
</template>
