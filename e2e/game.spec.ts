import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test, type BrowserContext, type Page } from '@playwright/test';

const privateSolutionPath = resolve('.private/solution-input.json');
const privateAnswer = existsSync(privateSolutionPath)
  ? (JSON.parse(readFileSync(privateSolutionPath, 'utf8')) as { acceptedAnswers: string[] })
      .acceptedAnswers[0]
  : null;
const captureDocs = process.env.CAPTURE_DOCS === '1';

const chapterOneTitles = [
  'Сводка 00:31',
  'Матвей Корин',
  'План станции «Север-7»',
  'Ева Миронова',
  'Артём Костин',
  'Ника Соколова',
  'Роман Ветров',
  'Лев Арсеньев',
  'Первичная временная линия',
];

const chapterFiveTitles = [
  'Журнал пропусков и двери A-3',
  'Предварительная медицинская справка',
  'Опись монтажного стола',
  'Переписка Матвея и Романа',
  'Пакет счетов «Линии Прибоя»',
  'Показания Евы Мироновой',
  'Показания Артёма Костина',
  'Показания Ники Соколовой',
  'Уточнение Романа Ветрова',
  'Показания Льва Арсеньева',
  'Контрольные времена маршрутов',
  'Внутренний отчёт охраны',
  'Аудит продюсерского пульта',
  'Блокнот и планшет Матвея',
  'Журнал калибровки студии B',
  'Паспорт ленты студии A',
  'Квитанция конференц-звонка',
  'Экспорт часов Матвея',
];

const requiredEvidenceTitles = [
  'Предварительная медицинская справка',
  'Экспорт часов Матвея',
  'Контрольная запись последнего эфира',
  'Журнал автоматизации эфира',
  'Уточнение Романа Ветрова',
  'Аудит продюсерского пульта',
  'Журнал пропусков и двери A-3',
  'Уточнённая временная линия',
  'Фото технической приёмки 23:50',
  'Четыре кадра резервных камер',
  'Кадр прибытия 23:07',
  'Техкарта аварийного контура B3',
  'Контрольные времена маршрутов',
  'Пакет счетов «Линии Прибоя»',
  'Блокнот и планшет Матвея',
];

const reconstructionOrder = [
  'P07', 'P02', 'P11', 'P04',
  'P09', 'P01', 'P06', 'P12',
  'P03', 'P10', 'P05', 'P08',
];

const openMaterial = async (page: Page, title: string) => {
  const card = page.locator('article.material-card').filter({
    has: page.getByRole('heading', { name: title, exact: true }),
  });
  await expect(card).toHaveCount(1);
  const freshButton = card.getByRole('button', { name: 'Изучить материал', exact: true });
  const reopenButton = card.getByRole('button', { name: 'Открыть снова', exact: true });
  if (await freshButton.count()) await freshButton.click();
  else await reopenButton.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
};

const chapterButton = (page: Page, title: string) =>
  page.locator('.chapter-nav button').filter({ hasText: title });

test.describe.serial('сквозное расследование', () => {
  let context: BrowserContext;
  let page: Page;
  const consoleErrors: string[] = [];
  const runtimeFailures: string[] = [];
  const externalRequests: string[] = [];

  test.beforeAll(async ({ browser }) => {
    context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    page = await context.newPage();
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => runtimeFailures.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 400) {
        runtimeFailures.push(`${response.status()} ${response.url()}`);
      }
    });
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });
  });

  test.afterAll(async () => context.close());

  test('1 — открывает стартовый экран', async () => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'ПОЛУНОЧНЫЙ ПРОТОКОЛ', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Начать расследование', exact: true })).toBeVisible();
    await expect(page.getByText('40–60 минут', { exact: true })).toBeVisible();
  });

  test('2 — начинает новую игру', async () => {
    await page.getByRole('button', { name: 'Начать расследование', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Станция Север-7', exact: true })).toBeVisible();
    await expect(chapterButton(page, 'Семь минут тишины')).toBeDisabled();
  });

  test('3 — открывает материал и карточку подозреваемого', async () => {
    await openMaterial(page, chapterOneTitles[0]);
    await page
      .locator('.suspect-nav')
      .getByRole('button', { name: 'Ева Миронова Продюсер выставки', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Карточка участника');
    await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  });

  test('4 — сохраняет заметку после перезагрузки', async () => {
    const notebook = page.getByRole('textbox', { name: 'Заметки команды', exact: true });
    await notebook.fill('Сверить поздний эфир и служебный маршрут.');
    await page.reload();
    await page.getByRole('button', { name: 'Продолжить расследование', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Заметки команды', exact: true })).toHaveValue(
      'Сверить поздний эфир и служебный маршрут.',
    );
  });

  test('5 — открывает трёхуровневую подсказку', async () => {
    for (const title of chapterOneTitles.slice(1)) await openMaterial(page, title);
    await page.getByRole('button', { name: 'Перейти к главе 2', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Семь минут тишины', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Открыть подсказку 1', exact: true }).click();
    await expect(page.getByText('Не ищите часы. Сначала отделите кадр с обычным белым светом от кадров на аварийном питании.', { exact: true })).toBeVisible();
  });

  test('6 — решает головоломку камер пользовательскими действиями', async () => {
    await openMaterial(page, 'Четыре кадра резервных камер');
    await openMaterial(page, 'Памятка аварийного контура');
    if (captureDocs) {
      await page.locator('.sequence-puzzle').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/cameras.jpg', type: 'jpeg', quality: 88 });
    }
    await page
      .locator('[aria-label="Переместить Кадр A · Катушка"]')
      .getByRole('button', { name: 'Переместить раньше', exact: true })
      .click();
    const moveBEarlier = page
      .locator('[aria-label="Переместить Кадр B · Две дуги"]')
      .getByRole('button', { name: 'Переместить раньше', exact: true });
    await moveBEarlier.click();
    await moveBEarlier.click();
    await page.getByRole('button', { name: 'Проверить последовательность', exact: true }).click();
    await expect(page.getByText('Последовательность согласуется со всеми индикаторами. Уточнённая линия добавлена в дело.', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Порядок кадров', exact: true })).toBeFocused();
    await openMaterial(page, 'Уточнённая временная линия');
  });

  test('7 — решает визуально-звуковую головоломку', async () => {
    await chapterButton(page, 'Последний эфир').click();
    await openMaterial(page, 'Контрольная запись последнего эфира');
    await openMaterial(page, 'Таблица монтажных меток');
    await openMaterial(page, 'Производственная переписка');
    await page.getByRole('textbox', { name: 'Команда из таблицы', exact: true }).fill('авто');
    await page.getByRole('button', { name: 'Проверить расшифровку', exact: true }).click();
    await expect(page.getByText('Метка прочитана. Открыт журнал происхождения и запуска записи.', { exact: true })).toBeVisible();
    await openMaterial(page, 'Журнал автоматизации эфира');
  });

  test('8 — собирает документ и исследует фотографию', async () => {
    await chapterButton(page, 'Архивная комната').click();
    await openMaterial(page, 'Фрагменты разорванной техкарты');
    await openMaterial(page, 'Фотография архива 00:29');
    await openMaterial(page, 'Кадр прибытия 23:07');

    const recoverableFragment = page.locator('button.paper-fragment').filter({ hasText: 'P02' });
    await recoverableFragment.click();
    await page.getByRole('button', { name: 'Ячейка 1: пусто', exact: true }).click();
    await page.getByRole('button', { name: 'Ячейка 1: P02', exact: true }).click();
    await expect(recoverableFragment).toBeEnabled();

    for (const [index, fragmentId] of reconstructionOrder.entries()) {
      await page.locator('button.paper-fragment').filter({ hasText: fragmentId }).click();
      await page
        .getByRole('button', { name: `Ячейка ${index + 1}: пусто`, exact: true })
        .click();
    }
    await page.getByRole('button', { name: 'Проверить сборку', exact: true }).click();
    await expect(page.getByText('Техкарта восстановлена. Короткий служебный маршрут добавлен в материалы.', { exact: true })).toBeVisible();

    const zoomPlus = page.getByRole('button', { name: 'Увеличить масштаб', exact: true });
    const contrastPlus = page.getByRole('button', { name: 'Повысить контраст', exact: true });
    const exposurePlus = page.getByRole('button', { name: 'Повысить экспозицию', exact: true });
    for (let index = 0; index < 10; index += 1) await zoomPlus.click();
    for (let index = 0; index < 11; index += 1) await contrastPlus.click();
    for (let index = 0; index < 3; index += 1) await exposurePlus.click();
    await page
      .getByRole('button', { name: 'Проверить область: Пылевой контур груза', exact: true })
      .click();
    await expect(page.getByText('Пылевой контур показывает, что тяжёлый предмет перемещали совсем недавно.', { exact: true })).toBeVisible();
    await openMaterial(page, 'Техкарта аварийного контура B3');
    await openMaterial(page, 'Фото технической приёмки 23:50');
  });

  test('9 — фильтрует и собирает доску улик', async () => {
    await chapterButton(page, 'Ложное алиби').click();
    for (const title of chapterFiveTitles) await openMaterial(page, title);

    const personFilter = page.getByRole('combobox', { name: 'Человек', exact: true });
    await personFilter.selectOption({ label: 'Ника Соколова' });
    await expect(page.locator('article.evidence-card').filter({ hasText: 'Показания Ники Соколовой' })).toBeVisible();
    await personFilter.selectOption({ label: 'Все участники' });

    const boardWidths = await page.locator('.evidence-board').evaluate((board) => {
      const catalog = board.querySelector<HTMLElement>('.evidence-board__catalog');
      const filters = board.querySelector<HTMLElement>('.evidence-filters');
      return {
        board: [board.clientWidth, board.scrollWidth],
        catalog: [catalog?.clientWidth ?? 0, catalog?.scrollWidth ?? 0],
        filters: [filters?.clientWidth ?? 0, filters?.scrollWidth ?? 0],
      };
    });
    expect(boardWidths.board[1]).toBeLessThanOrEqual(boardWidths.board[0]);
    expect(boardWidths.catalog[1]).toBeLessThanOrEqual(boardWidths.catalog[0]);
    expect(boardWidths.filters[1]).toBeLessThanOrEqual(boardWidths.filters[0]);

    for (const title of requiredEvidenceTitles) {
      const evidence = page.locator('article.evidence-card').filter({
        has: page.getByRole('heading', { name: title, exact: true }),
      });
      await evidence.getByRole('button', { name: 'В версию', exact: true }).click();
    }
    if (captureDocs) {
      await page.locator('.evidence-board').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/evidence-board.jpg', type: 'jpeg', quality: 88 });
    }
    await page.getByRole('button', { name: 'Проверить версию', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Кто совершил преступление?', exact: true })).toBeVisible();
  });

  test('10 — нейтрально обрабатывает неправильный финальный ответ', async () => {
    await page.getByRole('textbox', { name: 'Имя преступника', exact: true }).fill('Иван Иванов');
    await page.getByRole('button', { name: 'Предъявить обвинение', exact: true }).click();
    await expect(page.locator('.accusation-panel [role="status"]')).toContainText('Версия пока не объясняет все факты.');
    await expect(page.getByRole('heading', { name: 'Кто совершил преступление?', exact: true })).toBeVisible();
  });

  test('11 — локально расшифровывает правильный финал без production-обхода', async () => {
    test.skip(!privateAnswer, 'Приватное тестовое значение намеренно отсутствует в CI и Git.');
    await page.getByRole('textbox', { name: 'Имя преступника', exact: true }).fill(privateAnswer!);
    await page.getByRole('button', { name: 'Предъявить обвинение', exact: true }).click();
    const reveal = page.getByRole('dialog');
    await expect(reveal).toContainText('Дело раскрыто');
    await expect(reveal.locator('.epilogue-grid > div')).toHaveCount(6);
    await expect(reveal.locator('.final-stats')).toBeVisible();
  });

  test('12 — сбрасывает прогресс через собственное подтверждение', async () => {
    const finalRestart = page.getByRole('button', { name: 'Начать новое расследование', exact: true });
    if (await finalRestart.count()) await finalRestart.click();
    const startFresh = page.getByRole('button', { name: 'Начать расследование', exact: true });
    if (await startFresh.count()) await startFresh.click();
    await page.getByRole('textbox', { name: 'Заметки команды', exact: true }).fill('Временная заметка');
    await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click();
    await page.getByLabel('Крупный текст').check();
    await expect(page.locator('body')).toHaveClass(/large-text/);
    await page.getByRole('button', { name: 'Сбросить расследование', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Сбросить расследование?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Сбросить прогресс', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Начать расследование', exact: true })).toBeVisible();
  });

  test('13 — не создаёт критических ошибок, 404 или внешних runtime-запросов', () => {
    expect(consoleErrors).toEqual([]);
    expect(runtimeFailures).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});

test('14 — целевые viewport не имеют горизонтального переполнения', async ({ page }) => {
  const sizes = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
  ];

  for (const size of sizes) {
    await page.setViewportSize(size);
    await page.goto('./');
    await page.evaluate(() => window.localStorage.clear());
    await page.reload();
    const startButton = page.getByRole('button', { name: 'Начать расследование', exact: true });
    await expect(startButton).toBeInViewport();
    const startMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(startMetrics.scrollWidth).toBeLessThanOrEqual(startMetrics.clientWidth);

    await startButton.click();
    const terminalMetrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    expect(terminalMetrics.scrollWidth).toBeLessThanOrEqual(terminalMetrics.clientWidth);
    await expect(page.getByRole('button', { name: 'Открыть настройки', exact: true })).toBeInViewport();
  }
});
