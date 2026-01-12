```ts
const [filters, setFilters] = useState({
  role: 'admin',
  status: 'active',
});

// SADECE BUNU EKLE:
useScenario('UserListFilters', filters, setFilters);
```

```ts
const { register, handleSubmit, reset, watch } = useForm();
const values = watch(); // Form değerlerini izle

// SADECE BUNU EKLE:
useScenario('CreateUserForm', values, (data) => reset(data));
```
