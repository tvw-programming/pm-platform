# Extending the Platform

## Adding a New Feature Page

### 1. Create the page component

```tsx
// src/pages/MyFeaturePage.tsx
export function MyFeaturePage() {
  return (
    <Box>
      <PageHeader title="My Feature" description="What this does" />
      {/* content */}
    </Box>
  );
}
```

### 2. Register the route

```ts
// src/app/routes.tsx
const MyFeaturePage = lazy(() =>
  import('@/pages/MyFeaturePage').then(m => ({ default: m.MyFeaturePage }))
);

// Inside p/:productId children:
{ path: 'my-feature', element: page(<MyFeaturePage />) }
```

### 3. Add to navigation

```ts
// src/app/navigation.ts

// Add to paths:
myFeature: wp('my-feature'),

// Add to navSections (pick the right section):
{ id: 'my-feature', label: 'My Feature', to: paths.myFeature, icon: SomeIcon }
```

---

## Adding a New Task Status

1. **Add to enum** in `src/types/domain.ts`:
   ```ts
   export const TASK_STATUSES = [..., 'my_new_status'] as const;
   ```

2. **Add token** in `src/app/tokens.ts`:
   ```ts
   my_new_status: { label: 'My New Status', color: '#hex', bg: '#hex' },
   ```

3. **Update board logic** in `src/domain/selectors/board.ts` if needed.

4. **Add to status config UI** in `src/pages/SettingsPage.tsx` — the `StatusSection` already iterates `TASK_STATUSES` so it picks up automatically.

---

## Adding a New Workspace Reducer Action

```ts
// src/state/workspaceReducer.ts

// 1. Add to action union type:
type WorkspaceAction = 
  | ...
  | { type: 'myFeature/doSomething'; payload: { id: string } }

// 2. Add case to reducer:
case 'myFeature/doSomething':
  return { ...state, /* updated slice */ };
```

Then dispatch from any component:
```ts
const { dispatch } = useWorkspace();
dispatch({ type: 'myFeature/doSomething', payload: { id: 'abc' } });
```

---

## Replacing Mock Data with Real API

Currently all non-chat data is seeded from `src/mock-data/`. To connect to a real backend:

1. Create a service in `src/api/` (follow `chatApi.ts` as the pattern)
2. In the provider, replace the mock-data import with an API call in a `useEffect`
3. Dispatch `SET_*` actions to seed the state

**Example for tasks:**
```ts
// src/api/taskApi.ts
export async function listTasks(projectId: string): Promise<Task[]> {
  const res = await fetch(`${API_BASE}/api/tasks?projectId=${projectId}`);
  return res.json();
}
```

```ts
// Inside WorkspaceProvider useEffect:
useEffect(() => {
  taskApi.listTasks(activeProductId).then(tasks =>
    dispatch({ type: 'tasks/setAll', payload: tasks })
  );
}, [activeProductId]);
```

---

## Adding a Setting Section

1. Add to `SETTINGS_SECTIONS` in `src/app/navigation.ts`:
   ```ts
   { id: 'my-section', label: 'My section' }
   ```

2. Create a section component and render it in `SettingsPage.tsx`:
   ```tsx
   function MySection(): React.JSX.Element {
     return (
       <Card>
         <CardHeader title="My section" />
         <CardContent>...</CardContent>
       </Card>
     );
   }

   // In SettingsPage render:
   {active === 'my-section' ? <MySection /> : null}
   ```

---

## Theming

The MUI theme is in `src/app/theme.ts`. To modify:

```ts
// Change primary colour
palette: {
  primary: { main: '#YOUR_HEX' }
}

// Add a custom shadow
shadows: ['none', '0 1px 4px rgba(0,0,0,0.08)', ...]
```

Light and dark themes are separate objects passed to `ColorModeProvider`. Both must be updated when changing tokens.

---

## Performance Tips

- Wrap all list-item components in `memo()` — message lists can have hundreds of items
- Use `useMemo` for filtered/sorted lists in page components
- Use `useCallback` on event handlers passed to child components
- Keep WebSocket event handlers stable (defined outside render or with `useCallback`)

---

## Testing Strategy

Currently no test files exist. Recommended test setup:

| Layer | Tool | What to test |
|-------|------|-------------|
| Selectors | Vitest | Pure functions in `domain/selectors/` |
| Reducers | Vitest | `workspaceReducer` action cases |
| Components | React Testing Library | User interactions |
| API handlers | Go `net/http/httptest` | Handler request/response |
| Playbook engine | Go `testing` | Resolution primitives |

Add Vitest:
```bash
npm install --save-dev vitest @testing-library/react @testing-library/user-event
```

Add Go tests:
```bash
# server/internal/services/playbook_engine_test.go
func TestResolvePlaybook_FirstPresent(t *testing.T) { ... }
```
