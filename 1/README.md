
# Projeto Render + PostgreSQL

## Configuração

1) Configure DATABASE_URL nas variáveis de ambiente.
2) Execute:

```
CREATE TABLE usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT NOT NULL UNIQUE,
  senha TEXT NOT NULL
);

CREATE TABLE numeros (
  valor INT PRIMARY KEY
);

INSERT INTO usuarios (usuario, senha)
VALUES
  ('eric', '123'),
  ('maria', 'abc');
```

3) Deploy no Render com:
```
npm start
```
