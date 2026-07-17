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
  'Сводка по дому «Вереск»',
  'Арсений Белозёров',
  'Комнаты дома',
  'Максим Сапунович',
  'Лиля Родионовна',
  'Денис Сапунков',
  'Ксения Головаченко',
  'Вера Крылова',
  'Фото в прихожей',
];

const chapterFiveTitles = [
  'Проверка обуви',
  'Проверка пути к дровнику',
  'Контрольные маршруты',
  'Показания Максима',
  'Показания Лили',
  'Показания Дениса',
  'Показания Ксении',
  'Показания Веры',
  'Расписка о долге',
  'Новый договор Лили',
  'Спрятанный документ Ксении',
  'Справка о старой аварии',
  'Тёмный капюшон на чердаке',
  'Зелёная ткань на защёлке',
];

const requiredEvidenceTitles = [
  'Сводка по дому «Вереск»',
  'Пять отметок времени',
  'Что слышали на кухне',
  'Запись трёх звонков',
  'Памятка у телефона',
  'Проверка пути к дровнику',
  'Контрольные маршруты',
  'Квадратная пуговица',
  'Пальто после осмотра',
  'След на мокром полу',
  'Проверка обуви',
  'Старый лист работ',
  'Собранная записка Арсения',
];

const reconstructionOrder = ['F4', 'F1', 'F8', 'F3', 'F9', 'F2', 'F7', 'F5', 'F6'];

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

test.describe.serial('сквозное расследование в доме «Вереск»', () => {
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
      if (response.status() >= 400) runtimeFailures.push(`${response.status()} ${response.url()}`);
    });
    page.on('request', (request) => {
      const url = request.url();
      if (!url.startsWith('http://127.0.0.1:4173') && !url.startsWith('data:') && !url.startsWith('blob:')) {
        externalRequests.push(url);
      }
    });
  });

  test.afterAll(async () => context.close());

  test('1 — открывает новую обложку', async () => {
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'ТРИ КОРОТКИХ ЗВОНКА', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Начать расследование', exact: true })).toBeVisible();
    await expect(page.getByText('35–50 минут', { exact: true })).toBeVisible();
    if (captureDocs) await page.screenshot({ path: 'docs/screenshots/cover.jpg', type: 'jpeg', quality: 88 });
  });

  test('2 — начинает расследование и запускает музыку', async () => {
    await page.getByRole('button', { name: 'Начать расследование', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Дом «Вереск»', exact: true })).toBeVisible();
    await expect(chapterButton(page, 'До темноты')).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Выключить музыку', exact: true })).toBeVisible();
    if (captureDocs) await page.screenshot({ path: 'docs/screenshots/case-file.jpg', type: 'jpeg', quality: 88 });
  });

  test('3 — прокручивает длинный материал и открывает досье', async () => {
    const firstCard = page.locator('article.material-card').filter({
      has: page.getByRole('heading', { name: chapterOneTitles[0], exact: true }),
    });
    await firstCard.getByRole('button', { name: 'Изучить материал', exact: true }).click();
    const modalBody = page.locator('.modal__body');
    const imageStage = page.locator('.document-viewer__image-stage');
    await expect(modalBody).toHaveAttribute('tabindex', '0');
    await expect(imageStage).toHaveAttribute('role', 'region');
    await expect(imageStage).toHaveAttribute('tabindex', '0');
    await expect(imageStage).toHaveAttribute('aria-label', /Увеличенное изображение/);
    const scrollMetrics = await modalBody.evaluate((element) => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }));
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    await modalBody.focus();
    await page.keyboard.press('End');
    await expect.poll(() => modalBody.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();

    await page
      .locator('.suspect-nav')
      .getByRole('button', { name: 'Максим Сапунович Старый друг хозяина', exact: true })
      .click();
    await expect(page.getByRole('dialog')).toContainText('Карточка участника');
    await page.getByRole('button', { name: 'Закрыть окно', exact: true }).click();
  });

  test('4 — сохраняет заметку после перезагрузки', async () => {
    const notebook = page.getByRole('textbox', { name: 'Заметки команды', exact: true });
    await notebook.fill('Сверить звонки, мокрый след и путь к дровнику.');
    await page.reload();
    await page.getByRole('button', { name: 'Продолжить расследование', exact: true }).click();
    await expect(page.getByRole('textbox', { name: 'Заметки команды', exact: true })).toHaveValue(
      'Сверить звонки, мокрый след и путь к дровнику.',
    );
  });

  test('5 — изучает вводные и открывает подсказку', async () => {
    for (const title of chapterOneTitles.slice(1)) await openMaterial(page, title);
    await page.getByRole('button', { name: 'Перейти к главе 2', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'До темноты', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Открыть подсказку 1', exact: true }).click();
    await expect(page.getByText('Начните с конверта. Его показали до всех важных событий.', { exact: true })).toBeVisible();
  });

  test('6 — восстанавливает порядок вечера', async () => {
    await openMaterial(page, 'Пять отметок времени');
    await openMaterial(page, 'Что слышали на кухне');

    await page
      .locator('[aria-label="Переместить Конверт"]')
      .getByRole('button', { name: 'Переместить раньше', exact: true })
      .click();
    const secondCallEarlier = page
      .locator('[aria-label="Переместить Второй звонок"]')
      .getByRole('button', { name: 'Переместить раньше', exact: true });
    await secondCallEarlier.click();
    await secondCallEarlier.click();
    const watchEarlier = page
      .locator('[aria-label="Переместить Часы остановились"]')
      .getByRole('button', { name: 'Переместить раньше', exact: true });
    await watchEarlier.click();
    await watchEarlier.click();

    if (captureDocs) {
      await page.locator('.sequence-puzzle').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/timeline.jpg', type: 'jpeg', quality: 88 });
    }
    await page.getByRole('button', { name: 'Проверить последовательность', exact: true }).click();
    await expect(page.getByText('Порядок сходится. Убийство произошло до темноты и третьего звонка.', { exact: true })).toBeVisible();
    await openMaterial(page, 'Проверенная линия вечера');
    await openMaterial(page, 'Комнаты после звонков');
  });

  test('7 — находит телефон по ритму звонков', async () => {
    await chapterButton(page, 'Три коротких звонка').click();
    await openMaterial(page, 'Запись трёх звонков');
    await openMaterial(page, 'Памятка у телефона');
    await openMaterial(page, 'Кто слышал звонки');
    if (captureDocs) {
      await page.locator('.signal-puzzle').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/phone-rhythm.jpg', type: 'jpeg', quality: 88 });
    }
    await page.getByRole('textbox', { name: 'Откуда звонили?', exact: true }).fill('гостевой флигель');
    await page.getByRole('button', { name: 'Проверить ответ', exact: true }).click();
    await expect(page.getByText('Источник найден. Все три звонка пришли из гостевого флигеля.', { exact: true })).toBeVisible();
    await openMaterial(page, 'Источник звонков');
  });

  test('8 — собирает записку и осматривает зимний сад', async () => {
    await chapterButton(page, 'Конверт из стены').click();
    await openMaterial(page, 'Обгоревшие части записки');
    await openMaterial(page, 'Старый лист работ');
    await openMaterial(page, 'Фото зимнего сада');
    await openMaterial(page, 'Пальто после осмотра');
    await openMaterial(page, 'След на мокром полу');

    const recoverableFragment = page.locator('button.paper-fragment').filter({ hasText: 'F1' });
    await recoverableFragment.click();
    await page.getByRole('button', { name: 'Место 1: пусто', exact: true }).click();
    await page.getByRole('button', { name: 'Место 1: F1', exact: true }).click();
    await expect(recoverableFragment).toBeEnabled();

    for (const [index, fragmentId] of reconstructionOrder.entries()) {
      await page.locator('button.paper-fragment').filter({ hasText: fragmentId }).click();
      await page.getByRole('button', { name: `Место ${index + 1}: пусто`, exact: true }).click();
    }
    if (captureDocs) {
      await page.locator('.reconstruction-puzzle').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/note.jpg', type: 'jpeg', quality: 88 });
    }
    await page.getByRole('button', { name: 'Проверить записку', exact: true }).click();
    await expect(page.getByText('Записка собрана. Теперь ясно, зачем Арсений хранил старый лист.', { exact: true })).toBeVisible();

    const zoomPlus = page.getByRole('button', { name: 'Увеличить масштаб', exact: true });
    const contrastPlus = page.getByRole('button', { name: 'Повысить контраст', exact: true });
    const brightnessPlus = page.getByRole('button', { name: 'Повысить яркость', exact: true });
    for (let index = 0; index < 8; index += 1) await zoomPlus.click();
    for (let index = 0; index < 8; index += 1) await contrastPlus.click();
    for (let index = 0; index < 5; index += 1) await brightnessPlus.click();
    const target = page.getByRole('button', { name: 'Проверить область: Квадратная пуговица', exact: true });
    await expect.poll(async () => {
      const targetBox = await target.boundingBox();
      const viewportBox = await page.locator('.inspection-viewport').boundingBox();
      if (!targetBox || !viewportBox) return false;
      return (
        targetBox.x >= viewportBox.x &&
        targetBox.y >= viewportBox.y &&
        targetBox.x + targetBox.width <= viewportBox.x + viewportBox.width &&
        targetBox.y + targetBox.height <= viewportBox.y + viewportBox.height
      );
    }).toBe(true);
    if (captureDocs) {
      await page.locator('.photo-puzzle').scrollIntoViewIfNeeded();
      await page.screenshot({ path: 'docs/screenshots/winter-garden.jpg', type: 'jpeg', quality: 88 });
    }
    await target.click();
    await expect(page.getByText('На мокром полу найдена квадратная пуговица.', { exact: true })).toBeVisible();
    await openMaterial(page, 'Собранная записка Арсения');
    await openMaterial(page, 'Квадратная пуговица');
  });

  test('9 — фильтрует улики и собирает пять цепочек', async () => {
    await chapterButton(page, 'Стекло и дождь').click();
    for (const title of chapterFiveTitles) await openMaterial(page, title);

    const personFilter = page.getByRole('combobox', { name: 'Человек', exact: true });
    await personFilter.selectOption({ label: 'Денис Сапунков' });
    await expect(page.locator('article.evidence-card').filter({ hasText: 'Проверка обуви' })).toBeVisible();
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

  test('10 — спокойно отклоняет неверное обвинение', async () => {
    await page.getByRole('textbox', { name: 'Имя преступника', exact: true }).fill('Иван Иванов');
    await page.getByRole('button', { name: 'Предъявить обвинение', exact: true }).click();
    await expect(page.locator('.accusation-panel [role="status"]')).toContainText('Версия пока не сходится.');
    await expect(page.getByRole('heading', { name: 'Кто совершил преступление?', exact: true })).toBeVisible();
  });

  test('11 — локально открывает зашифрованный финал', async () => {
    test.skip(!privateAnswer, 'Приватное тестовое значение намеренно отсутствует в CI и Git.');
    await page.getByRole('textbox', { name: 'Имя преступника', exact: true }).fill(privateAnswer!);
    await page.getByRole('button', { name: 'Предъявить обвинение', exact: true }).click();
    const reveal = page.getByRole('dialog');
    await expect(reveal).toContainText('Дело раскрыто');
    await expect(reveal.locator('.revelation__art')).toBeVisible();
    await expect(reveal.locator('.epilogue-grid > div')).toHaveCount(6);
    await expect(reveal.locator('.final-stats')).toBeVisible();
  });

  test('12 — меняет размер текста, музыку и сбрасывает прогресс', async () => {
    const finalRestart = page.getByRole('button', { name: 'Начать новое расследование', exact: true });
    if (await finalRestart.count()) await finalRestart.click();
    const startFresh = page.getByRole('button', { name: 'Начать расследование', exact: true });
    if (await startFresh.count()) await startFresh.click();
    await page.getByRole('textbox', { name: 'Заметки команды', exact: true }).fill('Временная заметка');
    await page.getByRole('button', { name: 'Открыть настройки', exact: true }).click();
    const musicSwitch = page.getByRole('switch');
    await expect(musicSwitch).toHaveAttribute('aria-checked', 'true');
    await musicSwitch.click();
    await expect(musicSwitch).toHaveAttribute('aria-checked', 'false');
    await musicSwitch.click();
    await expect(musicSwitch).toHaveAttribute('aria-checked', 'true');
    await page.getByLabel('Крупный текст').check();
    await expect(page.locator('html')).toHaveClass(/large-text/);
    await expect(page.locator('body')).toHaveClass(/large-text/);
    await page.getByRole('button', { name: 'Сбросить расследование', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Сбросить расследование?', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Сбросить прогресс', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Начать расследование', exact: true })).toBeVisible();
  });

  test('13 — не создаёт ошибок, 404 или внешних запросов', () => {
    expect(consoleErrors).toEqual([]);
    expect(runtimeFailures).toEqual([]);
    expect(externalRequests).toEqual([]);
  });
});

test('14 — целевые экраны не имеют горизонтального переполнения', async ({ page }) => {
  const sizes = [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
    { width: 1024, height: 768 },
    { width: 390, height: 844 },
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

test('15 — без Web Audio игра продолжает работать спокойно', async ({ page }) => {
  const failures: string[] = [];
  page.on('pageerror', (error) => failures.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'AudioContext', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Начать расследование', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Дом «Вереск»', exact: true })).toBeVisible();
  const soundButton = page.getByRole('button', { name: 'Включить музыку', exact: true });
  await expect(soundButton).toBeVisible();
  await soundButton.click();
  await expect(soundButton).toBeVisible();
  expect(failures).toEqual([]);
});
