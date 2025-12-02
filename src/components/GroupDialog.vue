<template>
  <v-dialog
    :model-value="modelValue"
    max-width="500"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title
        class="text-h5 font-weight-bold"
        style="font-family: 'Special Elite', monospace"
        >{{ isEdit ? 'EDIT GROUP' : 'ADD GROUP' }}</v-card-title
      >

      <v-card-text>
        <v-form ref="formRef" v-model="valid">
          <v-select
            v-model="formData.parentId"
            :items="parentOptions"
            label="Parent Folder"
            variant="outlined"
            base-color="primary"
            color="primary"
            class="mb-4"
            clearable
          ></v-select>

          <v-text-field
            v-model="formData.name"
            label="Group Name"
            :rules="[rules.required]"
            variant="outlined"
            base-color="primary"
            color="primary"
            class="mb-4"
          />

          <v-text-field
            v-model.number="formData.orderNum"
            label="Order"
            type="number"
            :rules="[rules.required]"
            variant="outlined"
            base-color="primary"
            color="primary"
            class="mb-4"
          />

          <v-checkbox
            :model-value="formData.isPublic === 1"
            @update:model-value="(val) => (formData.isPublic = val ? 1 : 0)"
            label="Public (visible to guests)"
            color="primary"
            hide-details
          />
        </v-form>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="$emit('update:modelValue', false)" color="secondary"
          >Cancel</v-btn
        >
        <v-btn color="primary" :disabled="!valid" @click="handleSave" variant="flat">Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useNavigationStore } from '@/stores/navigation';
import type { Group, GroupWithSites } from '@/types';

interface Props {
  modelValue: boolean;
  group?: Group | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  save: [group: Group | Omit<Group, 'id'>];
}>();

const navStore = useNavigationStore();
const formRef = ref();
const valid = ref(false);
const formData = ref<Partial<Group>>({
  name: '',
  parentId: null,
  orderNum: 0,
  isPublic: 0, // 默认为私密（数据库用0/1）
});

const isEdit = ref(false);

const rules = {
  required: (value: any) => !!value || value === 0 || 'Required field',
};

// Flatten groups for selection
const flattenGroups = (
  groups: GroupWithSites[],
  prefix = ''
): { title: string; value: number | null }[] => {
  let options: { title: string; value: number | null }[] = [];
  groups.forEach((g) => {
    // Avoid selecting self or descendants as parent (circular dependency check needed in complex apps, simple check here)
    if (isEdit.value && props.group && g.id === props.group.id) return;

    options.push({ title: prefix + g.name, value: g.id! });
    if (g.children) {
      options = options.concat(flattenGroups(g.children, prefix + g.name + ' > '));
    }
  });
  return options;
};

const parentOptions = computed(() => {
  const list = flattenGroups(navStore.groups);
  list.unshift({ title: '(Root)', value: null });
  return list;
});

watch(
  () => props.group,
  (newGroup) => {
    if (newGroup) {
      // 编辑模式：直接使用数据库的值（已经是0/1）
      formData.value = {
        ...newGroup,
      };
      isEdit.value = true;
    } else {
      // 新建模式：默认为私密（0）
      formData.value = { name: '', parentId: null, orderNum: 0, isPublic: 0 };
      isEdit.value = false;
    }
  },
  { immediate: true }
);

// 监听对话框的打开/关闭，确保每次打开时都重置表单
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue && !props.group) {
      // 对话框打开且不是编辑模式时，重置表单
      formData.value = {
        name: '',
        parentId: null,
        orderNum: 0,
        isPublic: 0,
      };
      isEdit.value = false;
    }
  }
);

const handleSave = () => {
  if (!valid.value) return;

  // 直接使用 formData 的值，已经是正确的 0/1 格式
  emit('save', formData.value as Group);

  // 保存后关闭对话框，不清空表单（由 watch 处理）
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
:deep(.v-dialog__content) {
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.v-card) {
  border: 2px solid rgb(var(--v-theme-primary));
  transition: all 0.3s ease;
}

:deep(.v-card-title) {
  font-family: 'Special Elite', monospace !important;
  letter-spacing: 2px;
  text-transform: uppercase;
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.2);
}

:deep(.v-text-field),
:deep(.v-select),
:deep(.v-checkbox) {
  transition: all 0.25s ease;
}

:deep(.v-btn) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
}
</style>
