<template>
  <div class="home-view w-100 h-100 bg-background d-flex flex-column">
    <!-- Search / Command Input -->
    <div class="search-area w-100 px-6 py-4 flex-shrink-0 border-b-retro">
      <v-text-field
        v-model="searchQuery"
        placeholder="> SEARCH_PROTOCOL..."
        variant="outlined"
        density="compact"
        hide-details
        base-color="primary"
        color="primary"
        class="retro-input"
      >
        <template #prepend-inner>
          <span class="text-primary blink-cursor mr-2">></span>
        </template>
      </v-text-field>
    </div>

    <!-- Main Grid -->
    <div
      class="content-area w-100 flex-grow-1 pa-6"
      style="overflow-y: auto; flex: 1; min-height: 0; padding: 20px"
    >
      <v-row>
        <v-col v-for="group in filteredGroups" :key="group.id" cols="12" md="6" lg="4" xl="3">
          <GroupCard
            :group="group"
            @edit="handleEditGroup"
            @delete="handleDeleteGroup"
            @add-site="handleAddSite"
            @edit-site="handleEditSite"
            @delete-site="handleDeleteSite"
          />
        </v-col>

        <v-col v-if="!filteredGroups.length" cols="12" class="text-center mt-12">
          <div class="text-h5 text-secondary font-retro opacity-50">
            {{ searchQuery ? '> NO_MATCHES_FOUND' : '> SYSTEM_EMPTY' }}
          </div>
        </v-col>
      </v-row>
    </div>

    <!-- Dialogs -->
    <GroupDialog v-model="showAddGroupDialog" @save="handleSaveGroup" />

    <GroupDialog v-model="showEditGroupDialog" :group="editingGroup" @save="handleUpdateGroup" />

    <SiteDialog v-model="showAddSiteDialog" :group-id="selectedGroupId" @save="handleSaveSite" />

    <SiteDialog
      v-model="showEditSiteDialog"
      :site="editingSite"
      :group-id="selectedGroupId"
      @save="handleUpdateSite"
    />

    <ImportDialog v-model="showImportDialog" @imported="handleImported" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, inject } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNavigationStore } from '@/stores/navigation';
import GroupCard from '@/components/GroupCard.vue';
import GroupDialog from '@/components/GroupDialog.vue';
import SiteDialog from '@/components/SiteDialog.vue';
import ImportDialog from '@/components/ImportDialog.vue';
import type { Group, Site, GroupWithSites } from '@/types';
import { exportData } from '@/utils/api';

const authStore = useAuthStore();
const navStore = useNavigationStore();

const searchQuery = ref('');
const showAddGroupDialog = ref(false);
const showEditGroupDialog = ref(false);
const showAddSiteDialog = ref(false);
const showEditSiteDialog = ref(false);
const showImportDialog = ref(false);

// Inject toolbar events from App.vue
const toolbarEvents = inject('toolbar-events') as any;

const editingGroup = ref<Group | null>(null);
const editingSite = ref<Site | null>(null);
const selectedGroupId = ref<number | null>(null);

onMounted(async () => {
  await navStore.loadGroups();
  await navStore.loadConfigs();

  // Register toolbar event handlers
  if (toolbarEvents) {
    toolbarEvents.addGroup = () => {
      showAddGroupDialog.value = true;
    };
    toolbarEvents.export = handleExport;
    toolbarEvents.import = () => {
      showImportDialog.value = true;
    };
  }
});

// Recursive filtering function
const filterGroupRecursive = (group: GroupWithSites, query: string): GroupWithSites | null => {
  const lowerQuery = query.toLowerCase();

  // Check matches
  const nameMatch = group.name.toLowerCase().includes(lowerQuery);

  // Filter sites
  const filteredSites = group.sites.filter(
    (s) =>
      s.name.toLowerCase().includes(lowerQuery) ||
      s.url.toLowerCase().includes(lowerQuery) ||
      (s.description && s.description.toLowerCase().includes(lowerQuery))
  );

  // Filter children
  const filteredChildren: GroupWithSites[] = [];
  if (group.children) {
    group.children.forEach((child) => {
      const filteredChild = filterGroupRecursive(child, query);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    });
  }

  // Return group if it matches, or has matching content
  if (nameMatch || filteredSites.length > 0 || filteredChildren.length > 0) {
    return {
      ...group,
      sites: filteredSites, // Use filtered sites
      children: filteredChildren, // Use filtered children
    };
  }

  return null;
};

const filteredGroups = computed(() => {
  if (!searchQuery.value.trim()) {
    return navStore.groups;
  }

  const results: GroupWithSites[] = [];
  navStore.groups.forEach((group) => {
    const filtered = filterGroupRecursive(group, searchQuery.value);
    if (filtered) {
      results.push(filtered);
    }
  });
  return results;
});

const handleEditGroup = (group: Group) => {
  editingGroup.value = group;
  showEditGroupDialog.value = true;
};

const handleDeleteGroup = async (id: number) => {
  if (confirm('Are you sure you want to delete this group?')) {
    await navStore.removeGroup(id);
  }
};

const handleAddSite = (groupId: number) => {
  selectedGroupId.value = groupId;
  showAddSiteDialog.value = true;
};

const handleEditSite = (site: Site) => {
  editingSite.value = site;
  selectedGroupId.value = site.groupId;
  showEditSiteDialog.value = true;
};

const handleDeleteSite = async (id: number) => {
  if (confirm('Are you sure you want to delete this site?')) {
    await navStore.removeSite(id);
  }
};

const handleSaveGroup = async (group: Omit<Group, 'id'>) => {
  await navStore.addGroup(group);
  // Dialog 会自动关闭
};

const handleUpdateGroup = async (group: Group) => {
  if (group.id) {
    await navStore.editGroup(group.id, group);
    // Dialog 会自动关闭
  }
};

const handleSaveSite = async (site: Omit<Site, 'id'>) => {
  await navStore.addSite(site);
  // Dialog 会自动关闭
};

const handleUpdateSite = async (site: Site) => {
  if (site.id) {
    await navStore.editSite(site.id, site);
    // Dialog 会自动关闭
  }
};

const handleExport = async () => {
  try {
    const data = await exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `textus-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Export failed:', error);
    alert('Failed to export data');
  }
};

const handleImported = async () => {
  await navStore.loadGroups();
};
</script>

<style scoped lang="scss">
/* Retro Theme Utilities */
.font-retro {
  font-family: 'Special Elite', monospace !important;
}

.border-b-retro {
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-surface), 0.95);
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.08);
  transition: all 0.3s ease;
}

.border-retro {
  border: 1px solid rgb(var(--v-theme-primary));
}

.blink-cursor {
  animation: blink 0.8s step-end infinite;
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Custom Input Styling */
:deep(.retro-input) {
  width: 100%;
}

:deep(.retro-input .v-field__control) {
  background-color: rgba(var(--v-theme-primary), 0.05) !important;
  transition: background-color 0.3s ease !important;
}

:deep(.retro-input .v-field__outline__start),
:deep(.retro-input .v-field__outline__end),
:deep(.retro-input .v-field__outline__notch) {
  border-color: rgb(var(--v-theme-primary)) !important;
  transition: border-color 0.3s ease !important;
}

:deep(.retro-input input) {
  font-family: 'Special Elite', monospace !important;
  color: rgb(var(--v-theme-primary)) !important;
  letter-spacing: 1px;
}

:deep(.retro-input input::placeholder) {
  opacity: 0.6;
}

:deep(.retro-input:hover .v-field__control) {
  background-color: rgba(var(--v-theme-primary), 0.08) !important;
}

:deep(.retro-input:hover .v-field__outline__start),
:deep(.retro-input:hover .v-field__outline__end),
:deep(.retro-input:hover .v-field__outline__notch) {
  border-color: rgb(var(--v-theme-secondary)) !important;
}

/* Home View Container */
.home-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

/* Search Area Styling */
.search-area {
  backdrop-filter: blur(8px);
  animation: slideDown 0.4s ease;
}

.border-b-retro {
  border-bottom: 2px solid rgb(var(--v-theme-primary));
  background: rgba(var(--v-theme-surface), 0.95);
  box-shadow: 0 4px 20px rgba(var(--v-theme-primary), 0.08);
  transition: all 0.3s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Content Area */
.content-area {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
