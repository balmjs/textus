<template>
  <v-dialog
    :model-value="modelValue"
    max-width="700"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card>
      <v-card-title class="d-flex align-center justify-space-between">
        <span>Settings</span>
        <v-btn
          icon="mdi-close"
          variant="text"
          size="small"
          @click="$emit('update:modelValue', false)"
        />
      </v-card-title>

      <v-divider />

      <v-card-text class="pa-6">
        <v-tabs v-model="activeTab" color="primary">
          <v-tab value="general">General</v-tab>
          <v-tab value="appearance">Appearance</v-tab>
          <v-tab value="about">About</v-tab>
        </v-tabs>

        <v-window v-model="activeTab" class="mt-6">
          <!-- General Settings -->
          <v-window-item value="general">
            <v-form ref="formRef" v-model="valid">
              <v-text-field
                v-model="configs.siteTitle"
                label="Site Title"
                variant="outlined"
                hint="The name of your navigation site"
                persistent-hint
                class="mb-6"
              />

              <v-textarea
                v-model="configs.siteDescription"
                label="Site Description"
                variant="outlined"
                rows="3"
                hint="A brief description of your navigation site"
                persistent-hint
                class="mb-6"
              />

              <v-text-field
                v-model="configs.siteKeywords"
                label="Keywords"
                variant="outlined"
                hint="Comma-separated keywords for SEO"
                persistent-hint
                class="mb-6"
              />

              <v-alert type="info" variant="tonal" density="compact">
                These settings help with search engine optimization and branding.
              </v-alert>
            </v-form>
          </v-window-item>

          <!-- Appearance Settings -->
          <v-window-item value="appearance">
            <div class="d-flex flex-column ga-4">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="d-flex align-center justify-space-between mb-2">
                    <div>
                      <div class="text-subtitle-1 font-weight-medium">Dark Mode</div>
                      <div class="text-caption text-medium-emphasis">Toggle dark/light theme</div>
                    </div>
                    <v-switch
                      v-model="darkMode"
                      color="primary"
                      hide-details
                      @change="toggleTheme"
                    />
                  </div>
                </v-card-text>
              </v-card>

              <v-alert type="info" variant="tonal" density="compact">
                Appearance changes take effect immediately.
              </v-alert>
            </div>
          </v-window-item>

          <!-- About -->
          <v-window-item value="about">
            <div class="d-flex flex-column ga-4">
              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-h6 mb-2">✨ Textus</div>
                  <div class="text-body-2 text-medium-emphasis mb-4">
                    Successor to bookmarks, 1994–2025
                  </div>
                  <v-divider class="my-3" />
                  <div class="d-flex flex-column ga-2">
                    <div class="d-flex justify-space-between">
                      <span class="text-body-2">Version</span>
                      <span class="text-body-2 font-weight-medium">1.0.0</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-body-2">Framework</span>
                      <span class="text-body-2 font-weight-medium">Vue 3 + Vuetify 3</span>
                    </div>
                    <div class="d-flex justify-space-between">
                      <span class="text-body-2">Database</span>
                      <span class="text-body-2 font-weight-medium">Turso (libSQL)</span>
                    </div>
                  </div>
                </v-card-text>
              </v-card>

              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-subtitle-1 font-weight-medium mb-2">Features</div>
                  <ul class="text-body-2 text-medium-emphasis">
                    <li>Material Design 3 UI</li>
                    <li>Secure Authentication (JWT + bcrypt)</li>
                    <li>Guest Access Control</li>
                    <li>Drag & Drop Sorting</li>
                    <li>Data Import/Export</li>
                    <li>Responsive Design</li>
                  </ul>
                </v-card-text>
              </v-card>

              <v-card variant="outlined">
                <v-card-text>
                  <div class="text-subtitle-1 font-weight-medium mb-3">Links</div>
                  <div class="d-flex flex-wrap ga-2">
                    <v-btn
                      href="https://github.com/superwebmaker/textus"
                      target="_blank"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-github"
                    >
                      GitHub
                    </v-btn>
                    <v-btn
                      href="https://github.com/superwebmaker/textus/blob/main/README.md"
                      target="_blank"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-book-open-variant"
                    >
                      Documentation
                    </v-btn>
                    <v-btn
                      href="https://github.com/superwebmaker/textus/issues"
                      target="_blank"
                      variant="outlined"
                      size="small"
                      prepend-icon="mdi-bug"
                    >
                      Report Issue
                    </v-btn>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </v-window-item>
        </v-window>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="handleClose">Cancel</v-btn>
        <v-btn v-if="activeTab !== 'about'" color="primary" :loading="saving" @click="handleSave">
          Save Changes
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { useTheme } from 'vuetify';
import { useNavigationStore } from '@/stores/navigation';
import { updateAllSEOMeta } from '@/utils/seo';

interface Props {
  modelValue: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const navStore = useNavigationStore();
const theme = useTheme();

const activeTab = ref('general');
const formRef = ref();
const valid = ref(true);
const saving = ref(false);
const darkMode = ref(theme.global.current.value.dark);

const configs = ref({
  siteTitle: '',
  siteDescription: '',
  siteKeywords: '',
  gridColumns: 3,
});

// 加载配置
onMounted(async () => {
  await navStore.loadConfigs();
  loadConfigs();
});

// 监听对话框打开，重新加载配置
watch(
  () => props.modelValue,
  async (newValue) => {
    if (newValue) {
      await navStore.loadConfigs();
      loadConfigs();
    }
  }
);

const loadConfigs = () => {
  configs.value.siteTitle = navStore.configs.siteTitle || 'Textus';
  configs.value.siteDescription = navStore.configs.siteDescription || '';
  configs.value.siteKeywords = navStore.configs.siteKeywords || '';
  configs.value.gridColumns = parseInt(navStore.configs.gridColumns || '3');

  // 加载主题设置
  const savedTheme = navStore.configs.theme || localStorage.getItem('theme') || 'light';
  darkMode.value = savedTheme === 'dark';
};

const toggleTheme = () => {
  const newTheme = darkMode.value ? 'dark' : 'light';
  theme.change(newTheme);
  localStorage.setItem('theme', newTheme);
};

const handleSave = async () => {
  if (activeTab.value === 'general') {
    if (!valid.value) return;

    try {
      saving.value = true;

      // 保存通用设置
      await navStore.updateConfig('siteTitle', configs.value.siteTitle);
      await navStore.updateConfig('siteDescription', configs.value.siteDescription);
      await navStore.updateConfig('siteKeywords', configs.value.siteKeywords);

      // 立即更新所有 SEO meta 标签
      const logoUrl = `${window.location.origin}/textus.svg`;
      updateAllSEOMeta({
        title: configs.value.siteTitle || 'Textus – The Successor to Bookmarks',
        description:
          configs.value.siteDescription ||
          'Textus is the true successor to browser bookmarks. Beautiful, shareable, cloud-powered visual startpages that finally replace the chaotic 30-year-old bookmark system.',
        keywords:
          configs.value.siteKeywords ||
          'Textus, bookmark alternative, visual bookmarks, startpage, personal dashboard, aesthetic homepage, link in bio, bookmark manager 2.0, new tab page, successor to bookmarks',
        image: logoUrl,
        url: window.location.origin,
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      saving.value = false;
    }
  } else if (activeTab.value === 'appearance') {
    try {
      saving.value = true;

      // 保存外观设置
      await navStore.updateConfig('gridColumns', String(configs.value.gridColumns));
      await navStore.updateConfig('theme', theme.global.name.value);
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      saving.value = false;
    }
  }

  emit('update:modelValue', false);
};

const handleClose = () => {
  loadConfigs(); // 恢复原始值
  emit('update:modelValue', false);
};
</script>

<style scoped lang="scss">
.v-window {
  min-height: 400px;
}

:deep(.v-dialog__content) {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

:deep(.v-card) {
  border: 1px solid rgba(var(--v-theme-primary), 0.2);
  transition: all 0.3s ease;
}

:deep(.v-card:hover) {
  border-color: rgba(var(--v-theme-primary), 0.4);
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.1);
}

:deep(.v-tabs) {
  border-bottom: 2px solid rgb(var(--v-theme-primary));
}

:deep(.v-tab) {
  font-family: 'Special Elite', monospace !important;
  letter-spacing: 1px;
  transition: all 0.25s ease;

  &:hover:not(.v-tab--selected) {
    opacity: 0.7;
  }
}

:deep(.v-btn) {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  text-transform: uppercase;
  letter-spacing: 0.5px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }
}

:deep(.v-switch) {
  transition: all 0.25s ease;
}
</style>
