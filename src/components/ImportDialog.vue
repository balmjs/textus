<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="text-h5 font-weight-bold" style="font-family: 'Special Elite', monospace"
        >IMPORT DATA</v-card-title
      >

      <v-card-text>
        <v-alert
          type="info"
          variant="tonal"
          class="mb-4"
          color="primary"
          style="border: 1px solid rgb(var(--v-theme-primary))"
        >
          <div class="text-body-2">
            <strong>Supported Formats:</strong>
            <ul class="ml-4 mt-1">
              <li>Textus JSON Export</li>
              <li>Browser Bookmarks (HTML)</li>
            </ul>
          </div>
          <div class="text-body-2 mt-2">
            <strong>Processing:</strong>
            <ul class="ml-4 mt-1">
              <li>Folders -> Groups (Structure Preserved)</li>
              <li>Bookmarks -> Sites</li>
            </ul>
          </div>
        </v-alert>

        <v-file-input
          v-model="file"
          label="Select file (JSON or HTML)"
          accept=".json,.html"
          prepend-icon="mdi-file-upload"
          variant="outlined"
          base-color="primary"
          color="primary"
          :error-messages="errorMessage"
          @change="errorMessage = ''"
        />

        <v-alert
          v-if="importResult"
          :type="importResult.success ? 'success' : 'error'"
          variant="tonal"
          class="mt-4"
        >
          <template v-if="importResult.success">
            <div class="text-body-2 font-weight-bold mb-2">Import Successful!</div>
            <div class="text-body-2">
              <strong>Groups:</strong> {{ importResult.stats?.groups.created }} created,
              {{ importResult.stats?.groups.merged }} merged
            </div>
            <div class="text-body-2">
              <strong>Sites:</strong> {{ importResult.stats?.sites.created }} created,
              {{ importResult.stats?.sites.updated }} updated,
              {{ importResult.stats?.sites.skipped }} skipped
            </div>
          </template>
          <template v-else>
            <div class="text-body-2 font-weight-bold">Import Failed</div>
            <div class="text-body-2">{{ importResult.error }}</div>
          </template>
        </v-alert>
      </v-card-text>

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleClose" color="secondary">
          {{ importResult ? 'Close' : 'Cancel' }}
        </v-btn>
        <v-btn
          v-if="!importResult"
          color="primary"
          :disabled="!file"
          :loading="loading"
          @click="handleImport"
          variant="flat"
        >
          Import
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { importData } from '@/utils/api';
import type { ExportData, ImportResult, Group, Site } from '@/types';

interface Props {
  modelValue: boolean;
}

defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  imported: [];
}>();

const file = ref<File | File[] | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const importResult = ref<ImportResult | null>(null);

const parseBookmarks = (html: string): ExportData => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const groups: Group[] = [];
  const sites: Site[] = [];

  let groupIdCounter = -1; // Negative IDs for temp mapping

  const walk = (dl: Element, parentId: number | null) => {
    const children = Array.from(dl.children);

    children.forEach((node) => {
      if (node.tagName === 'DT') {
        const h3 = node.querySelector('h3');
        const a = node.querySelector('a');

        if (h3) {
          // Folder found
          const id = groupIdCounter--;
          groups.push({
            id,
            name: h3.textContent || 'Untitled Folder',
            parentId,
            orderNum: groups.length,
            isPublic: 1,
          });

          // Look for children (DL)
          // Structure variants:
          // 1. <DT><H3>...</H3><DL>...</DL></DT> (Nested)
          // 2. <DT><H3>...</H3></DT><DD><DL>...</DL></DD> (Sibling DD)
          let childDl = node.querySelector('dl');

          if (!childDl) {
            // Check next sibling DD
            const next = node.nextElementSibling;
            if (next && next.tagName === 'DD') {
              childDl = next.querySelector('dl');
            }
          }

          if (childDl) {
            walk(childDl, id);
          }
        } else if (a) {
          // Bookmark found
          if (parentId !== null) {
            // Only add if inside a folder (or root group)
            sites.push({
              groupId: parentId,
              name: a.textContent || 'Untitled Site',
              url: a.getAttribute('href') || '#',
              icon: a.getAttribute('icon'),
              orderNum: sites.length,
              isPublic: 1,
            });
          }
        }
      }
    });
  };

  // Start from root DL
  const rootDl = doc.querySelector('dl');
  if (rootDl) {
    // Create a Root group for top-level items to avoid orphans if needed
    // But usually Bookmarks Bar is the root DL.
    // We can treat top-level DL items as "Root" (parentId = null).
    // But my logic requires sites to have a groupId.

    // Let's create a default "Imported" root folder just in case,
    // OR we map parentId=null to specific logic.
    // But currently sites MUST have a groupId.

    // Strategy: Create a wrapper root group.
    const rootId = groupIdCounter--;
    groups.push({
      id: rootId,
      name: 'Imported Bookmarks',
      parentId: null,
      orderNum: 0,
      isPublic: 1,
    });

    walk(rootDl, rootId);
  }

  return { groups, sites, configs: {}, version: '1.0.0', exportDate: new Date().toISOString() };
};

const handleImport = async () => {
  if (!file.value) {
    errorMessage.value = 'Please select a file';
    return;
  }

  try {
    loading.value = true;
    errorMessage.value = '';
    importResult.value = null;

    const selectedFile = Array.isArray(file.value) ? file.value[0] : file.value;

    if (!selectedFile) {
      errorMessage.value = 'Please select a file';
      return;
    }

    const fileContent = await selectedFile.text();
    let data: ExportData;

    // Detect type
    if (selectedFile.name.endsWith('.json') || fileContent.trim().startsWith('{')) {
      data = JSON.parse(fileContent);
      if (!data.groups || !Array.isArray(data.groups)) {
        throw new Error('Invalid JSON format.');
      }
    } else {
      // Assume HTML
      data = parseBookmarks(fileContent);
      if (data.groups.length === 0 && data.sites.length === 0) {
        throw new Error('No bookmarks found in HTML file.');
      }
    }

    const result = await importData(data);
    importResult.value = result;

    if (result.success) {
      emit('imported');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      errorMessage.value = 'Invalid file format';
    } else {
      errorMessage.value = error instanceof Error ? error.message : 'Import failed';
    }
  } finally {
    loading.value = false;
  }
};

const handleClose = () => {
  file.value = null;
  errorMessage.value = '';
  importResult.value = null;
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

:deep(.v-alert) {
  border: 1px solid rgba(var(--v-theme-primary), 0.3) !important;
  transition: all 0.25s ease;
}

:deep(.v-file-input) {
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
