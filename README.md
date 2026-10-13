# Posts Explorer

Тестовое приложение: загрузка 1000+ записей с сервера, отображение в виртуализированной
таблице с поиском и подсветкой совпадений.

## Стек

- **Vite** + **React 18** + **TypeScript** (strict)
- **@tanstack/react-table** + **@tanstack/react-virtual** — таблица и виртуализация
- **CSS Modules** — изоляция стилей без рантайма
- **Docker / docker-compose** — для запуска dev-сервера в контейнере

## Функционал

- Загрузка JSON с [Fake API by rtcoder](https://rtcoder.github.io/fake-api/posts.json) (1000 постов)
- Прогресс загрузки в процентах (при наличии `Content-Length`) либо indeterminate-индикатор
- Кнопка отмены загрузки (`AbortController`)
- Виртуализированная таблица (рендерится только видимое окно строк)
- Поиск по `title` и `body` с debounce 300 ms
- Подсветка всех вхождений поискового запроса в ячейке

## Требования

- Node.js **20+** (см. `.nvmrc`)
- npm 10+
- (опционально) Docker 24+ и docker-compose

## Запуск локально

```bash
nvm use           # либо вручную установите Node 20
npm install
npm run dev
```

Откройте http://localhost:5173

## Запуск через Docker

```bash
docker compose up --build
```

Откройте http://localhost:5173

Остановить: `Ctrl+C`, затем `docker compose down`.

## Prod-сборка (локально)

```bash
npm run build
npm run preview
```

`npm run build` собирает статику в `dist/`. Её можно раздать любым
статическим сервером (nginx, caddy и т.п.).

## Тесты

```bash
npm test        # один прогон
npm run test:watch   # watch-режим
```

## Структура проекта

```
src/
├── app/                    # корневой компонент и его стили
├── shared/ui/              # переиспользуемые UI-примитивы (Button)
├── features/posts/
│   ├── api/                # HTTP-слой: fetchPosts
│   ├── lib/                # чистые утилиты (highlightMatches)
│   ├── model/              # типы и хуки: usePostsQuery, usePostsSearch, useDebouncedValue
│   └── ui/                 # компоненты фичи: PostsTable, PostsSearch, PostsLoader
└── styles/                 # глобальные стили
```

Принципы:

- **Feature-sliced** — код сгруппирован по фичам, а не по типам файлов.
- **Слои внутри фичи** — `api` (I/O), `model` (state/logic), `ui` (view), `lib` (pure utils).
- **Кастомные хуки инкапсулируют состояние** — компоненты остаются «тонкими».
- **Discriminated union** для статусов загрузки — TypeScript ловит недопустимые состояния на этапе компиляции.

## Архитектурные решения

### Загрузка с прогрессом и отменой

`fetch` + `response.body.getReader()` читаем стрим вручную, считаем
принятые байты и сравниваем с `Content-Length`. Если заголовка нет —
переходим в режим indeterminate.

Отмена — через `AbortController`. При `abort()` ридер выбрасывает `AbortError`,
и хук переводит статус в `cancelled` (отличается от `error` — это осознанное
действие пользователя).

### Состояния загрузки

Конечный автомат: `idle → loading → success | error | cancelled`.
Из `error` / `cancelled` доступен переход в `loading` по кнопке «Повторить».
Отмена возможна только в состоянии `loading`.

### Поиск

Ввод пользователя проходит через `useDebouncedValue(300ms)`, чтобы не
фильтровать 1000 строк на каждый keystroke. Фильтрация — клиентская, через
`useMemo` по `title` + `body`, регистронезависимая.

### Подсветка

Утилита `highlightMatches` режет строку на фрагменты и оборачивает совпадения
в `<mark>`. Оригинальный регистр текста сохраняется. Все вхождения, не только первое.

### Виртуализация

`useVirtualizer` из `@tanstack/react-virtual` рендерит только видимое окно
строк (плюс overscan). Высота строки фиксирована (40px), что даёт O(1)
вычисления позиций.

### Обработка ошибок

Два уровня:

1. **Ожидаемые ошибки загрузки** (`usePostsQuery`) — сеть, HTTP-статус, отмена.
   Каждая ситуация — отдельное состояние с собственным UI и возможностью повтора.

2. **Непредвиденные ошибки рендера** (`ErrorBoundary` на верхнем уровне) —
   ловит баги в компонентах и показывает fallback вместо белого экрана.
   В dev-режиме отображает текст ошибки, в prod — только общее сообщение.

## Лицензия

MIT