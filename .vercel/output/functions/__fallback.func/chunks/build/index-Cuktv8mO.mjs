import { n as useEventBranding, o as _sfc_main$b, k as _sfc_main$g, b as useAppConfig, c as useComponentUI, t as tv, f as formErrorsInjectionKey, d as formInputsInjectionKey, i as inputIdInjectionKey, e as formFieldInjectionKey, P as Primitive, g as useFormField, h as useFieldGroup, j as useComponentIcons, l as _sfc_main$e, a as useForwardExpose, m as looseToNumber } from './server.mjs';
import { defineComponent, ref, reactive, mergeProps, unref, withCtx, createTextVNode, createVNode, useSlots, computed, inject, useId, watch, provide, renderSlot, toDisplayString, openBlock, createBlock, createCommentVNode, useTemplateRef, useSSRContext } from 'vue';
import { ssrRenderAttrs, ssrRenderAttr, ssrInterpolate, ssrRenderComponent, ssrRenderList, ssrRenderClass, ssrRenderSlot } from 'vue/server-renderer';
import { useVModel } from '@vueuse/core';
import { a as publicAssetsURL } from '../_/nitro.mjs';
import { _ as _export_sfc } from './_plugin-vue_export-helper-1tPrXgE0.mjs';
import 'vue-router';
import '@iconify/vue';
import 'tailwindcss/colors';
import '@vueuse/shared';
import 'tailwind-variants';
import '@iconify/utils/lib/css/icon';
import '../routes/renderer.mjs';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/plugins';
import 'unhead/utils';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import '@iconify/utils';
import 'node:crypto';
import 'consola';
import 'node:fs';
import 'node:path';

var Label_vue_vue_type_script_setup_true_lang_default = /* @__PURE__ */ defineComponent({
  __name: "Label",
  props: {
    for: {
      type: String,
      required: false
    },
    asChild: {
      type: Boolean,
      required: false
    },
    as: {
      type: null,
      required: false,
      default: "label"
    }
  },
  setup(__props) {
    const props = __props;
    useForwardExpose();
    return (_ctx, _cache) => {
      return openBlock(), createBlock(unref(Primitive), mergeProps(props, { onMousedown: _cache[0] || (_cache[0] = (event) => {
        if (!event.defaultPrevented && event.detail > 1) event.preventDefault();
      }) }), {
        default: withCtx(() => [renderSlot(_ctx.$slots, "default")]),
        _: 3
      }, 16);
    };
  }
});
var Label_default = Label_vue_vue_type_script_setup_true_lang_default;
const theme$1 = {
  "slots": {
    "root": "",
    "wrapper": "",
    "labelWrapper": "flex content-center items-center justify-between gap-1",
    "label": "block font-medium text-default",
    "container": "relative",
    "description": "text-muted",
    "error": "mt-2 text-error",
    "hint": "text-muted",
    "help": "mt-2 text-muted"
  },
  "variants": {
    "size": {
      "xs": {
        "root": "text-xs"
      },
      "sm": {
        "root": "text-xs"
      },
      "md": {
        "root": "text-sm"
      },
      "lg": {
        "root": "text-sm"
      },
      "xl": {
        "root": "text-base"
      }
    },
    "required": {
      "true": {
        "label": "after:content-['*'] after:ms-0.5 after:text-error"
      }
    },
    "orientation": {
      "vertical": {
        "container": "mt-1"
      },
      "horizontal": {
        "root": "flex justify-between place-items-baseline gap-2"
      }
    }
  },
  "defaultVariants": {
    "size": "md",
    "orientation": "vertical"
  }
};
const _sfc_main$2 = {
  __name: "UFormField",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    name: { type: String, required: false },
    errorPattern: { type: null, required: false },
    label: { type: String, required: false },
    description: { type: String, required: false },
    help: { type: String, required: false },
    error: { type: [Boolean, String], required: false, default: void 0 },
    hint: { type: String, required: false },
    size: { type: null, required: false },
    required: { type: Boolean, required: false },
    eagerValidation: { type: Boolean, required: false },
    validateOnInputDelay: { type: Number, required: false },
    orientation: { type: null, required: false },
    class: { type: null, required: false },
    ui: { type: Object, required: false }
  },
  setup(__props) {
    const props = __props;
    const slots = useSlots();
    const appConfig = useAppConfig();
    const uiProp = useComponentUI("formField", props);
    const ui = computed(() => tv({ extend: tv(theme$1), ...appConfig.ui?.formField || {} })({
      size: props.size,
      required: props.required,
      orientation: props.orientation
    }));
    const formErrors = inject(formErrorsInjectionKey, null);
    const error = computed(() => props.error || formErrors?.value?.find((error2) => error2.name === props.name || props.errorPattern && error2.name?.match(props.errorPattern))?.message);
    const id = ref(useId());
    const ariaId = id.value;
    const formInputs = inject(formInputsInjectionKey, void 0);
    watch(id, () => {
      if (formInputs && props.name) {
        formInputs.value[props.name] = { id: id.value, pattern: props.errorPattern };
      }
    }, { immediate: true });
    provide(inputIdInjectionKey, id);
    provide(formFieldInjectionKey, computed(() => ({
      error: error.value,
      name: props.name,
      size: props.size,
      eagerValidation: props.eagerValidation,
      validateOnInputDelay: props.validateOnInputDelay,
      errorPattern: props.errorPattern,
      hint: props.hint,
      description: props.description,
      help: props.help,
      ariaId
    })));
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(Primitive), mergeProps({
        as: __props.as,
        "data-orientation": __props.orientation,
        "data-slot": "root",
        class: ui.value.root({ class: [unref(uiProp)?.root, props.class] })
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<div data-slot="wrapper" class="${ssrRenderClass(ui.value.wrapper({ class: unref(uiProp)?.wrapper }))}"${_scopeId}>`);
            if (__props.label || !!slots.label) {
              _push2(`<div data-slot="labelWrapper" class="${ssrRenderClass(ui.value.labelWrapper({ class: unref(uiProp)?.labelWrapper }))}"${_scopeId}>`);
              _push2(ssrRenderComponent(unref(Label_default), {
                for: id.value,
                "data-slot": "label",
                class: ui.value.label({ class: unref(uiProp)?.label })
              }, {
                default: withCtx((_2, _push3, _parent3, _scopeId2) => {
                  if (_push3) {
                    ssrRenderSlot(_ctx.$slots, "label", { label: __props.label }, () => {
                      _push3(`${ssrInterpolate(__props.label)}`);
                    }, _push3, _parent3, _scopeId2);
                  } else {
                    return [
                      renderSlot(_ctx.$slots, "label", { label: __props.label }, () => [
                        createTextVNode(toDisplayString(__props.label), 1)
                      ])
                    ];
                  }
                }),
                _: 3
              }, _parent2, _scopeId));
              if (__props.hint || !!slots.hint) {
                _push2(`<span${ssrRenderAttr("id", `${unref(ariaId)}-hint`)} data-slot="hint" class="${ssrRenderClass(ui.value.hint({ class: unref(uiProp)?.hint }))}"${_scopeId}>`);
                ssrRenderSlot(_ctx.$slots, "hint", { hint: __props.hint }, () => {
                  _push2(`${ssrInterpolate(__props.hint)}`);
                }, _push2, _parent2, _scopeId);
                _push2(`</span>`);
              } else {
                _push2(`<!---->`);
              }
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            if (__props.description || !!slots.description) {
              _push2(`<p${ssrRenderAttr("id", `${unref(ariaId)}-description`)} data-slot="description" class="${ssrRenderClass(ui.value.description({ class: unref(uiProp)?.description }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "description", { description: __props.description }, () => {
                _push2(`${ssrInterpolate(__props.description)}`);
              }, _push2, _parent2, _scopeId);
              _push2(`</p>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div><div class="${ssrRenderClass([(__props.label || !!slots.label || __props.description || !!slots.description) && ui.value.container({ class: unref(uiProp)?.container })])}"${_scopeId}>`);
            ssrRenderSlot(_ctx.$slots, "default", { error: error.value }, null, _push2, _parent2, _scopeId);
            if (props.error !== false && (typeof error.value === "string" && error.value || !!slots.error)) {
              _push2(`<div${ssrRenderAttr("id", `${unref(ariaId)}-error`)} data-slot="error" class="${ssrRenderClass(ui.value.error({ class: unref(uiProp)?.error }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "error", { error: error.value }, () => {
                _push2(`${ssrInterpolate(error.value)}`);
              }, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else if (__props.help || !!slots.help) {
              _push2(`<div${ssrRenderAttr("id", `${unref(ariaId)}-help`)} data-slot="help" class="${ssrRenderClass(ui.value.help({ class: unref(uiProp)?.help }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "help", { help: __props.help }, () => {
                _push2(`${ssrInterpolate(__props.help)}`);
              }, _push2, _parent2, _scopeId);
              _push2(`</div>`);
            } else {
              _push2(`<!---->`);
            }
            _push2(`</div>`);
          } else {
            return [
              createVNode("div", {
                "data-slot": "wrapper",
                class: ui.value.wrapper({ class: unref(uiProp)?.wrapper })
              }, [
                __props.label || !!slots.label ? (openBlock(), createBlock("div", {
                  key: 0,
                  "data-slot": "labelWrapper",
                  class: ui.value.labelWrapper({ class: unref(uiProp)?.labelWrapper })
                }, [
                  createVNode(unref(Label_default), {
                    for: id.value,
                    "data-slot": "label",
                    class: ui.value.label({ class: unref(uiProp)?.label })
                  }, {
                    default: withCtx(() => [
                      renderSlot(_ctx.$slots, "label", { label: __props.label }, () => [
                        createTextVNode(toDisplayString(__props.label), 1)
                      ])
                    ]),
                    _: 3
                  }, 8, ["for", "class"]),
                  __props.hint || !!slots.hint ? (openBlock(), createBlock("span", {
                    key: 0,
                    id: `${unref(ariaId)}-hint`,
                    "data-slot": "hint",
                    class: ui.value.hint({ class: unref(uiProp)?.hint })
                  }, [
                    renderSlot(_ctx.$slots, "hint", { hint: __props.hint }, () => [
                      createTextVNode(toDisplayString(__props.hint), 1)
                    ])
                  ], 10, ["id"])) : createCommentVNode("", true)
                ], 2)) : createCommentVNode("", true),
                __props.description || !!slots.description ? (openBlock(), createBlock("p", {
                  key: 1,
                  id: `${unref(ariaId)}-description`,
                  "data-slot": "description",
                  class: ui.value.description({ class: unref(uiProp)?.description })
                }, [
                  renderSlot(_ctx.$slots, "description", { description: __props.description }, () => [
                    createTextVNode(toDisplayString(__props.description), 1)
                  ])
                ], 10, ["id"])) : createCommentVNode("", true)
              ], 2),
              createVNode("div", {
                class: [(__props.label || !!slots.label || __props.description || !!slots.description) && ui.value.container({ class: unref(uiProp)?.container })]
              }, [
                renderSlot(_ctx.$slots, "default", { error: error.value }),
                props.error !== false && (typeof error.value === "string" && error.value || !!slots.error) ? (openBlock(), createBlock("div", {
                  key: 0,
                  id: `${unref(ariaId)}-error`,
                  "data-slot": "error",
                  class: ui.value.error({ class: unref(uiProp)?.error })
                }, [
                  renderSlot(_ctx.$slots, "error", { error: error.value }, () => [
                    createTextVNode(toDisplayString(error.value), 1)
                  ])
                ], 10, ["id"])) : __props.help || !!slots.help ? (openBlock(), createBlock("div", {
                  key: 1,
                  id: `${unref(ariaId)}-help`,
                  "data-slot": "help",
                  class: ui.value.help({ class: unref(uiProp)?.help })
                }, [
                  renderSlot(_ctx.$slots, "help", { help: __props.help }, () => [
                    createTextVNode(toDisplayString(__props.help), 1)
                  ])
                ], 10, ["id"])) : createCommentVNode("", true)
              ], 2)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
};
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/@nuxt/ui/dist/runtime/components/FormField.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const theme = {
  "slots": {
    "root": "relative inline-flex items-center",
    "base": [
      "w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75",
      "transition-colors"
    ],
    "leading": "absolute inset-y-0 start-0 flex items-center",
    "leadingIcon": "shrink-0 text-dimmed",
    "leadingAvatar": "shrink-0",
    "leadingAvatarSize": "",
    "trailing": "absolute inset-y-0 end-0 flex items-center",
    "trailingIcon": "shrink-0 text-dimmed"
  },
  "variants": {
    "fieldGroup": {
      "horizontal": {
        "root": "group has-focus-visible:z-[1]",
        "base": "group-not-only:group-first:rounded-e-none group-not-only:group-last:rounded-s-none group-not-last:group-not-first:rounded-none"
      },
      "vertical": {
        "root": "group has-focus-visible:z-[1]",
        "base": "group-not-only:group-first:rounded-b-none group-not-only:group-last:rounded-t-none group-not-last:group-not-first:rounded-none"
      }
    },
    "size": {
      "xs": {
        "base": "px-2 py-1 text-sm/4 gap-1",
        "leading": "ps-2",
        "trailing": "pe-2",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-4"
      },
      "sm": {
        "base": "px-2.5 py-1.5 text-sm/4 gap-1.5",
        "leading": "ps-2.5",
        "trailing": "pe-2.5",
        "leadingIcon": "size-4",
        "leadingAvatarSize": "3xs",
        "trailingIcon": "size-4"
      },
      "md": {
        "base": "px-2.5 py-1.5 text-base/5 gap-1.5",
        "leading": "ps-2.5",
        "trailing": "pe-2.5",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-5"
      },
      "lg": {
        "base": "px-3 py-2 text-base/5 gap-2",
        "leading": "ps-3",
        "trailing": "pe-3",
        "leadingIcon": "size-5",
        "leadingAvatarSize": "2xs",
        "trailingIcon": "size-5"
      },
      "xl": {
        "base": "px-3 py-2 text-base gap-2",
        "leading": "ps-3",
        "trailing": "pe-3",
        "leadingIcon": "size-6",
        "leadingAvatarSize": "xs",
        "trailingIcon": "size-6"
      }
    },
    "variant": {
      "outline": "text-highlighted bg-default ring ring-inset ring-accented",
      "soft": "text-highlighted bg-elevated/50 hover:bg-elevated focus:bg-elevated disabled:bg-elevated/50",
      "subtle": "text-highlighted bg-elevated ring ring-inset ring-accented",
      "ghost": "text-highlighted bg-transparent hover:bg-elevated focus:bg-elevated disabled:bg-transparent dark:disabled:bg-transparent",
      "none": "text-highlighted bg-transparent"
    },
    "color": {
      "primary": "",
      "secondary": "",
      "success": "",
      "info": "",
      "warning": "",
      "error": "",
      "neutral": ""
    },
    "leading": {
      "true": ""
    },
    "trailing": {
      "true": ""
    },
    "loading": {
      "true": ""
    },
    "highlight": {
      "true": ""
    },
    "fixed": {
      "false": ""
    },
    "type": {
      "file": "file:me-1.5 file:font-medium file:text-muted file:outline-none"
    }
  },
  "compoundVariants": [
    {
      "color": "primary",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
    },
    {
      "color": "secondary",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary"
    },
    {
      "color": "success",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-success"
    },
    {
      "color": "info",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-info"
    },
    {
      "color": "warning",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-warning"
    },
    {
      "color": "error",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-error"
    },
    {
      "color": "primary",
      "highlight": true,
      "class": "ring ring-inset ring-primary"
    },
    {
      "color": "secondary",
      "highlight": true,
      "class": "ring ring-inset ring-secondary"
    },
    {
      "color": "success",
      "highlight": true,
      "class": "ring ring-inset ring-success"
    },
    {
      "color": "info",
      "highlight": true,
      "class": "ring ring-inset ring-info"
    },
    {
      "color": "warning",
      "highlight": true,
      "class": "ring ring-inset ring-warning"
    },
    {
      "color": "error",
      "highlight": true,
      "class": "ring ring-inset ring-error"
    },
    {
      "color": "neutral",
      "variant": [
        "outline",
        "subtle"
      ],
      "class": "focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-inverted"
    },
    {
      "color": "neutral",
      "highlight": true,
      "class": "ring ring-inset ring-inverted"
    },
    {
      "leading": true,
      "size": "xs",
      "class": "ps-7"
    },
    {
      "leading": true,
      "size": "sm",
      "class": "ps-8"
    },
    {
      "leading": true,
      "size": "md",
      "class": "ps-9"
    },
    {
      "leading": true,
      "size": "lg",
      "class": "ps-10"
    },
    {
      "leading": true,
      "size": "xl",
      "class": "ps-11"
    },
    {
      "trailing": true,
      "size": "xs",
      "class": "pe-7"
    },
    {
      "trailing": true,
      "size": "sm",
      "class": "pe-8"
    },
    {
      "trailing": true,
      "size": "md",
      "class": "pe-9"
    },
    {
      "trailing": true,
      "size": "lg",
      "class": "pe-10"
    },
    {
      "trailing": true,
      "size": "xl",
      "class": "pe-11"
    },
    {
      "loading": true,
      "leading": true,
      "class": {
        "leadingIcon": "animate-spin"
      }
    },
    {
      "loading": true,
      "leading": false,
      "trailing": true,
      "class": {
        "trailingIcon": "animate-spin"
      }
    },
    {
      "fixed": false,
      "size": "xs",
      "class": "md:text-xs"
    },
    {
      "fixed": false,
      "size": "sm",
      "class": "md:text-xs"
    },
    {
      "fixed": false,
      "size": "md",
      "class": "md:text-sm"
    },
    {
      "fixed": false,
      "size": "lg",
      "class": "md:text-sm"
    }
  ],
  "defaultVariants": {
    "size": "md",
    "color": "primary",
    "variant": "outline"
  }
};
const _sfc_main$1 = /* @__PURE__ */ Object.assign({ inheritAttrs: false }, {
  __name: "UInput",
  __ssrInlineRender: true,
  props: {
    as: { type: null, required: false },
    id: { type: String, required: false },
    name: { type: String, required: false },
    type: { type: null, required: false, default: "text" },
    placeholder: { type: String, required: false },
    color: { type: null, required: false },
    variant: { type: null, required: false },
    size: { type: null, required: false },
    required: { type: Boolean, required: false },
    autocomplete: { type: [String, Object], required: false, default: "off" },
    autofocus: { type: Boolean, required: false },
    autofocusDelay: { type: Number, required: false, default: 0 },
    disabled: { type: Boolean, required: false },
    highlight: { type: Boolean, required: false },
    fixed: { type: Boolean, required: false },
    modelValue: { type: null, required: false },
    defaultValue: { type: null, required: false },
    modelModifiers: { type: null, required: false },
    class: { type: null, required: false },
    ui: { type: Object, required: false },
    icon: { type: null, required: false },
    avatar: { type: Object, required: false },
    leading: { type: Boolean, required: false },
    leadingIcon: { type: null, required: false },
    trailing: { type: Boolean, required: false },
    trailingIcon: { type: null, required: false },
    loading: { type: Boolean, required: false },
    loadingIcon: { type: null, required: false }
  },
  emits: ["update:modelValue", "blur", "change"],
  setup(__props, { expose: __expose, emit: __emit }) {
    const props = __props;
    const emits = __emit;
    const slots = useSlots();
    const modelValue = useVModel(props, "modelValue", emits, { defaultValue: props.defaultValue });
    const appConfig = useAppConfig();
    const uiProp = useComponentUI("input", props);
    const { emitFormBlur, emitFormInput, emitFormChange, size: formFieldSize, color, id, name, highlight, disabled, emitFormFocus, ariaAttrs } = useFormField(props, {});
    const { orientation, size: fieldGroupSize } = useFieldGroup(props);
    const { isLeading, isTrailing, leadingIconName, trailingIconName } = useComponentIcons(props);
    const inputSize = computed(() => fieldGroupSize.value || formFieldSize.value);
    const ui = computed(() => tv({ extend: tv(theme), ...appConfig.ui?.input || {} })({
      type: props.type,
      color: color.value,
      variant: props.variant,
      size: inputSize?.value,
      loading: props.loading,
      highlight: highlight.value,
      fixed: props.fixed,
      leading: isLeading.value || !!props.avatar || !!slots.leading,
      trailing: isTrailing.value || !!slots.trailing,
      fieldGroup: orientation.value
    }));
    const inputRef = useTemplateRef("inputRef");
    function updateInput(value) {
      if (props.modelModifiers?.trim && (typeof value === "string" || value === null || value === void 0)) {
        value = value?.trim() ?? null;
      }
      if (props.modelModifiers?.number || props.type === "number") {
        value = looseToNumber(value);
      }
      if (props.modelModifiers?.nullable) {
        value ||= null;
      }
      if (props.modelModifiers?.optional && !props.modelModifiers?.nullable && value !== null) {
        value ||= void 0;
      }
      modelValue.value = value;
      emitFormInput();
    }
    function onInput(event) {
      if (!props.modelModifiers?.lazy) {
        updateInput(event.target.value);
      }
    }
    function onChange(event) {
      const value = event.target.value;
      if (props.modelModifiers?.lazy) {
        updateInput(value);
      }
      if (props.modelModifiers?.trim) {
        event.target.value = value.trim();
      }
      emitFormChange();
      emits("change", event);
    }
    function onBlur(event) {
      emitFormBlur();
      emits("blur", event);
    }
    __expose({
      inputRef
    });
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(Primitive), mergeProps({
        as: __props.as,
        "data-slot": "root",
        class: ui.value.root({ class: [unref(uiProp)?.root, props.class] })
      }, _attrs), {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<input${ssrRenderAttrs(mergeProps({
              id: unref(id),
              ref_key: "inputRef",
              ref: inputRef,
              type: __props.type,
              value: unref(modelValue),
              name: unref(name),
              placeholder: __props.placeholder,
              "data-slot": "base",
              class: ui.value.base({ class: unref(uiProp)?.base }),
              disabled: unref(disabled),
              required: __props.required,
              autocomplete: __props.autocomplete
            }, { ..._ctx.$attrs, ...unref(ariaAttrs) }))}${_scopeId}>`);
            ssrRenderSlot(_ctx.$slots, "default", { ui: ui.value }, null, _push2, _parent2, _scopeId);
            if (unref(isLeading) || !!__props.avatar || !!slots.leading) {
              _push2(`<span data-slot="leading" class="${ssrRenderClass(ui.value.leading({ class: unref(uiProp)?.leading }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "leading", { ui: ui.value }, () => {
                if (unref(isLeading) && unref(leadingIconName)) {
                  _push2(ssrRenderComponent(_sfc_main$g, {
                    name: unref(leadingIconName),
                    "data-slot": "leadingIcon",
                    class: ui.value.leadingIcon({ class: unref(uiProp)?.leadingIcon })
                  }, null, _parent2, _scopeId));
                } else if (!!__props.avatar) {
                  _push2(ssrRenderComponent(_sfc_main$e, mergeProps({
                    size: unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                  }, __props.avatar, {
                    "data-slot": "leadingAvatar",
                    class: ui.value.leadingAvatar({ class: unref(uiProp)?.leadingAvatar })
                  }), null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
              }, _push2, _parent2, _scopeId);
              _push2(`</span>`);
            } else {
              _push2(`<!---->`);
            }
            if (unref(isTrailing) || !!slots.trailing) {
              _push2(`<span data-slot="trailing" class="${ssrRenderClass(ui.value.trailing({ class: unref(uiProp)?.trailing }))}"${_scopeId}>`);
              ssrRenderSlot(_ctx.$slots, "trailing", { ui: ui.value }, () => {
                if (unref(trailingIconName)) {
                  _push2(ssrRenderComponent(_sfc_main$g, {
                    name: unref(trailingIconName),
                    "data-slot": "trailingIcon",
                    class: ui.value.trailingIcon({ class: unref(uiProp)?.trailingIcon })
                  }, null, _parent2, _scopeId));
                } else {
                  _push2(`<!---->`);
                }
              }, _push2, _parent2, _scopeId);
              _push2(`</span>`);
            } else {
              _push2(`<!---->`);
            }
          } else {
            return [
              createVNode("input", mergeProps({
                id: unref(id),
                ref_key: "inputRef",
                ref: inputRef,
                type: __props.type,
                value: unref(modelValue),
                name: unref(name),
                placeholder: __props.placeholder,
                "data-slot": "base",
                class: ui.value.base({ class: unref(uiProp)?.base }),
                disabled: unref(disabled),
                required: __props.required,
                autocomplete: __props.autocomplete
              }, { ..._ctx.$attrs, ...unref(ariaAttrs) }, {
                onInput,
                onBlur,
                onChange,
                onFocus: unref(emitFormFocus)
              }), null, 16, ["id", "type", "value", "name", "placeholder", "disabled", "required", "autocomplete", "onFocus"]),
              renderSlot(_ctx.$slots, "default", { ui: ui.value }),
              unref(isLeading) || !!__props.avatar || !!slots.leading ? (openBlock(), createBlock("span", {
                key: 0,
                "data-slot": "leading",
                class: ui.value.leading({ class: unref(uiProp)?.leading })
              }, [
                renderSlot(_ctx.$slots, "leading", { ui: ui.value }, () => [
                  unref(isLeading) && unref(leadingIconName) ? (openBlock(), createBlock(_sfc_main$g, {
                    key: 0,
                    name: unref(leadingIconName),
                    "data-slot": "leadingIcon",
                    class: ui.value.leadingIcon({ class: unref(uiProp)?.leadingIcon })
                  }, null, 8, ["name", "class"])) : !!__props.avatar ? (openBlock(), createBlock(_sfc_main$e, mergeProps({
                    key: 1,
                    size: unref(uiProp)?.leadingAvatarSize || ui.value.leadingAvatarSize()
                  }, __props.avatar, {
                    "data-slot": "leadingAvatar",
                    class: ui.value.leadingAvatar({ class: unref(uiProp)?.leadingAvatar })
                  }), null, 16, ["size", "class"])) : createCommentVNode("", true)
                ])
              ], 2)) : createCommentVNode("", true),
              unref(isTrailing) || !!slots.trailing ? (openBlock(), createBlock("span", {
                key: 1,
                "data-slot": "trailing",
                class: ui.value.trailing({ class: unref(uiProp)?.trailing })
              }, [
                renderSlot(_ctx.$slots, "trailing", { ui: ui.value }, () => [
                  unref(trailingIconName) ? (openBlock(), createBlock(_sfc_main$g, {
                    key: 0,
                    name: unref(trailingIconName),
                    "data-slot": "trailingIcon",
                    class: ui.value.trailingIcon({ class: unref(uiProp)?.trailingIcon })
                  }, null, 8, ["name", "class"])) : createCommentVNode("", true)
                ])
              ], 2)) : createCommentVNode("", true)
            ];
          }
        }),
        _: 3
      }, _parent));
    };
  }
});
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("../node_modules/@nuxt/ui/dist/runtime/components/Input.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _imports_0 = publicAssetsURL("/images/hero-outside.webp");
const _imports_1 = publicAssetsURL("/images/hero-outside.jpg");
const _sfc_main = /* @__PURE__ */ defineComponent({
  __name: "index",
  __ssrInlineRender: true,
  setup(__props) {
    const { showTheAfters, eventName } = useEventBranding();
    const registered = ref(false);
    const loading = ref(false);
    const form = reactive({
      name: "",
      email: ""
    });
    const galleryImages = [
      "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1514525253361-bee8a187499b?auto=format&fit=crop&q=80&w=800",
      "https://images.unsplash.com/photo-1505236858219-8359eb29e329?auto=format&fit=crop&q=80&w=800"
    ];
    return (_ctx, _push, _parent, _attrs) => {
      const _component_UButton = _sfc_main$b;
      const _component_UIcon = _sfc_main$g;
      const _component_UFormField = _sfc_main$2;
      const _component_UInput = _sfc_main$1;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative overflow-x-hidden bg-gray-950 min-h-screen" }, _attrs))} data-v-12bb94d8><div class="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 blur-[120px] rounded-full" data-v-12bb94d8></div><div class="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-500/10 blur-[120px] rounded-full" data-v-12bb94d8></div><section class="relative isolate flex min-h-hero items-center py-16 sm:py-20" data-v-12bb94d8><div class="pointer-events-none absolute inset-0 -z-10 overflow-hidden" data-v-12bb94d8><picture data-v-12bb94d8><source${ssrRenderAttr("srcset", _imports_0)} type="image/webp" data-v-12bb94d8><img${ssrRenderAttr("src", _imports_1)} alt="A field at sunset" class="absolute inset-0 h-full w-full object-cover object-[50%_80%]" decoding="async" fetchpriority="high" data-v-12bb94d8></picture><div class="absolute inset-0 bg-gradient-to-b from-gray-950/25 via-gray-950/55 to-gray-950/95" data-v-12bb94d8></div><div class="absolute inset-0 bg-gradient-to-r from-primary-500/15 via-transparent to-accent-500/15" data-v-12bb94d8></div><div class="absolute inset-0 hero-grain opacity-25 mix-blend-overlay" data-v-12bb94d8></div></div><div class="w-full px-4 sm:px-6 lg:px-10" data-v-12bb94d8><div class="max-w-4xl mx-auto text-center" data-v-12bb94d8><div class="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/25 text-primary-300 text-sm font-medium backdrop-blur" data-v-12bb94d8><span class="relative flex h-2 w-2" data-v-12bb94d8><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-400 opacity-75" data-v-12bb94d8></span><span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500" data-v-12bb94d8></span></span> Registration Open </div><div class="min-h-[4.5rem] sm:min-h-[5.5rem] md:min-h-[6.5rem] lg:min-h-[7rem] flex items-center justify-center mb-6" data-v-12bb94d8>`);
      if (unref(showTheAfters)) {
        _push(`<div class="glow-text text-5xl md:text-7xl font-black tracking-tight" data-v-12bb94d8> THE <span class="text-primary-500" data-v-12bb94d8>AFTERS</span></div>`);
      } else {
        _push(`<div class="glow-text text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-primary-500 max-w-4xl mx-auto leading-[1.1] px-2" data-v-12bb94d8> Afters at Harry&#39;s </div>`);
      }
      _push(`</div><p class="text-xl md:text-2xl text-gray-200 max-w-2xl mx-auto mb-10 leading-relaxed" data-v-12bb94d8><span class="font-semibold text-white" data-v-12bb94d8>${ssrInterpolate(unref(eventName))}</span> is gonna be sick — everyone’s gonna be there. <span class="block mt-2 font-semibold text-white" data-v-12bb94d8>Fairfax Year 13 Prom After Party.</span></p><div class="flex flex-col sm:flex-row items-center justify-center gap-4" data-v-12bb94d8>`);
      _push(ssrRenderComponent(_component_UButton, {
        to: "#register",
        size: "xl",
        color: "primary",
        class: "px-8 py-4 font-bold text-lg rounded-2xl transition-transform hover:scale-105"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Register Interest `);
          } else {
            return [
              createTextVNode(" Register Interest ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(ssrRenderComponent(_component_UButton, {
        to: "#what-is-it",
        size: "xl",
        variant: "ghost",
        color: "neutral",
        class: "px-8 py-4 font-bold text-lg rounded-2xl backdrop-blur bg-gray-950/10 border border-white/10"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Learn More `);
          } else {
            return [
              createTextVNode(" Learn More ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div></div></section><section id="what-is-it" class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-v-12bb94d8><div class="grid md:grid-cols-2 gap-12 items-center" data-v-12bb94d8><div class="space-y-8" data-v-12bb94d8><h2 class="text-3xl md:text-4xl font-bold" data-v-12bb94d8> What is ${ssrInterpolate(unref(eventName))}? </h2><p class="text-lg text-gray-400 leading-relaxed" data-v-12bb94d8> It&#39;s the only way to end prom night. We&#39;re taking over a field, setting up the lights, and keeping the energy high until the sun comes up. </p><div class="grid grid-cols-1 sm:grid-cols-2 gap-6" data-v-12bb94d8><div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box" data-v-12bb94d8>`);
      _push(ssrRenderComponent(_component_UIcon, {
        name: "i-lucide-users",
        class: "w-8 h-8 text-primary-500 mb-4"
      }, null, _parent));
      _push(`<h3 class="font-bold mb-2" data-v-12bb94d8>Everyone&#39;s Invited</h3><p class="text-sm text-gray-500" data-v-12bb94d8>The whole of Year 13 coming together for one last night.</p></div><div class="p-6 rounded-2xl bg-gray-900/50 border border-gray-800 glow-box" data-v-12bb94d8>`);
      _push(ssrRenderComponent(_component_UIcon, {
        name: "i-lucide-heart",
        class: "w-8 h-8 text-accent-500 mb-4"
      }, null, _parent));
      _push(`<h3 class="font-bold mb-2" data-v-12bb94d8>Non-Profit</h3><p class="text-sm text-gray-500" data-v-12bb94d8>Every penny goes into the party or free drinks for you.</p></div></div></div><div class="relative group" data-v-12bb94d8><div class="absolute -inset-1 bg-gradient-to-r from-primary-500 to-accent-500 rounded-3xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" data-v-12bb94d8></div><img src="https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&amp;fit=crop&amp;q=80&amp;w=1200" alt="Party vibes" class="relative rounded-3xl object-cover aspect-video shadow-2xl" data-v-12bb94d8></div></div></section><section class="py-24 bg-gray-900/30 border-y border-gray-900" data-v-12bb94d8><div class="max-w-4xl mx-auto px-4 text-center" data-v-12bb94d8><h2 class="text-3xl font-bold mb-6" data-v-12bb94d8>Keeping it Real</h2><div class="p-8 rounded-3xl bg-gray-950 border border-primary-500/20 glow-box" data-v-12bb94d8><p class="text-xl md:text-2xl font-medium mb-4" data-v-12bb94d8>Tickets will be around <span class="text-primary-500 font-black" data-v-12bb94d8>£5–£6</span></p><p class="text-gray-400 leading-relaxed" data-v-12bb94d8> We&#39;re not here to make money. All revenue goes towards setup costs (generators, lights, sound, etc.). <span class="text-white font-semibold" data-v-12bb94d8>Any excess money will be spent on free drinks for everyone.</span></p></div></div></section><section id="register" class="py-24 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto" data-v-12bb94d8><div class="text-center mb-12" data-v-12bb94d8><h2 class="text-4xl font-black mb-4" data-v-12bb94d8>REGISTER YOUR INTEREST</h2><p class="text-gray-400 mb-2" data-v-12bb94d8> For <span class="text-white font-semibold" data-v-12bb94d8>${ssrInterpolate(unref(eventName))}</span> — tell us you’re in. </p><p class="text-gray-400" data-v-12bb94d8> At the moment you can <span class="text-white font-bold" data-v-12bb94d8>ONLY</span> register interest. Tickets are <span class="text-white font-bold" data-v-12bb94d8>NOT</span> on sale yet. The more people who sign up, the more likely we can make it happen. </p></div>`);
      if (!unref(registered)) {
        _push(`<div class="p-8 rounded-3xl bg-gray-900/50 border border-gray-800" data-v-12bb94d8><form class="space-y-6" data-v-12bb94d8>`);
        _push(ssrRenderComponent(_component_UFormField, {
          label: "Full Name",
          name: "name"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UInput, {
                modelValue: unref(form).name,
                "onUpdate:modelValue": ($event) => unref(form).name = $event,
                placeholder: "John Doe",
                size: "xl",
                class: "w-full",
                required: ""
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UInput, {
                  modelValue: unref(form).name,
                  "onUpdate:modelValue": ($event) => unref(form).name = $event,
                  placeholder: "John Doe",
                  size: "xl",
                  class: "w-full",
                  required: ""
                }, null, 8, ["modelValue", "onUpdate:modelValue"])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UFormField, {
          label: "School Email",
          name: "email"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(ssrRenderComponent(_component_UInput, {
                modelValue: unref(form).email,
                "onUpdate:modelValue": ($event) => unref(form).email = $event,
                type: "email",
                placeholder: "student@fairfax.school",
                size: "xl",
                class: "w-full",
                required: ""
              }, null, _parent2, _scopeId));
            } else {
              return [
                createVNode(_component_UInput, {
                  modelValue: unref(form).email,
                  "onUpdate:modelValue": ($event) => unref(form).email = $event,
                  type: "email",
                  placeholder: "student@fairfax.school",
                  size: "xl",
                  class: "w-full",
                  required: ""
                }, null, 8, ["modelValue", "onUpdate:modelValue"])
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(ssrRenderComponent(_component_UButton, {
          type: "submit",
          size: "xl",
          color: "primary",
          block: "",
          loading: unref(loading),
          class: "font-bold py-4 rounded-2xl"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(` Count Me In `);
            } else {
              return [
                createTextVNode(" Count Me In ")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</form></div>`);
      } else {
        _push(`<div class="p-12 rounded-3xl bg-primary-500/10 border border-primary-500/20 text-center animate-in fade-in zoom-in duration-500" data-v-12bb94d8>`);
        _push(ssrRenderComponent(_component_UIcon, {
          name: "i-lucide-check-circle",
          class: "w-16 h-16 text-primary-500 mx-auto mb-4"
        }, null, _parent));
        _push(`<h3 class="text-2xl font-bold mb-2" data-v-12bb94d8>You&#39;re on the list!</h3><p class="text-gray-400" data-v-12bb94d8> Thanks ${ssrInterpolate(unref(form).name.split(" ")[0])}! We&#39;ll email you at ${ssrInterpolate(unref(form).email)} as soon as tickets go live for ${ssrInterpolate(unref(eventName))}. </p>`);
        _push(ssrRenderComponent(_component_UButton, {
          variant: "ghost",
          class: "mt-6",
          onClick: ($event) => registered.value = false
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`Back`);
            } else {
              return [
                createTextVNode("Back")
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`</div>`);
      }
      _push(`</section><section class="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto" data-v-12bb94d8><h2 class="text-3xl font-bold mb-12 text-center" data-v-12bb94d8>The Vibe</h2><div class="grid grid-cols-2 md:grid-cols-3 gap-4" data-v-12bb94d8><!--[-->`);
      ssrRenderList(galleryImages, (img, i) => {
        _push(`<div class="relative group overflow-hidden rounded-2xl aspect-square" data-v-12bb94d8><img${ssrRenderAttr("src", img)} class="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110" alt="Prom afters vibe" data-v-12bb94d8><div class="absolute inset-0 bg-gradient-to-t from-gray-950/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" data-v-12bb94d8></div></div>`);
      });
      _push(`<!--]--></div></section><div class="hidden" data-v-12bb94d8></div><div class="fixed bottom-4 right-4 z-50" data-v-12bb94d8>`);
      _push(ssrRenderComponent(_component_UButton, {
        to: "#register",
        color: "primary",
        size: "lg",
        icon: "i-lucide-arrow-down-right",
        class: "rounded-full bg-primary-500 hover:bg-primary-600 text-white shadow-xl shadow-primary-500/35 border border-white/10"
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(` Register interest `);
          } else {
            return [
              createTextVNode(" Register interest ")
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`</div></div>`);
    };
  }
});
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("pages/index.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
const index = /* @__PURE__ */ _export_sfc(_sfc_main, [["__scopeId", "data-v-12bb94d8"]]);

export { index as default };
//# sourceMappingURL=index-Cuktv8mO.mjs.map
