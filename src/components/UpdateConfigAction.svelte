<script lang="ts">
  import type { AppState } from '../app-state'
  import type { UpdateConfigActionWithId } from '../operations'
  import type { Peg } from '../debtor-info'
  import {
    Alert,
    DEFAULT_PEG_ABBR,
    DEFAULT_PEG_COIN,
    DEFAULT_AMOUNT_DIVISOR,
    DEFAULT_DECIMAL_PLACES,
  } from '../app-state'
  import { amountToLocaleString } from '../utils'
  import Fab, { Icon, Label } from '@smui/fab'
  import Textfield from '@smui/textfield'
  import TextfieldIcon from '@smui/textfield/icon'
  import CharacterCounter from '@smui/textfield/character-counter/index'
  import HelperText from '@smui/textfield/helper-text/index'
  import LayoutGrid, { Cell } from '@smui/layout-grid'
  import PegInput from './PegInput.svelte'
  import Page from './Page.svelte'

  export let app: AppState
  export let action: UpdateConfigActionWithId
  export const snackbarBottom: string = "84px"

  const homepagePattern = "^[^\\/?#:]+([\\/?#]\\S*)?$"
  const currencyNoPegAlert = (
    'Не сте задали фиксиран курс на обмен между вашата валута и добре известна валута. ' +
    'Това вероятно ще обърка потребителите на вашата валута и ще направи ' +
    'автоматичните обменни операции с вашата валута невъзможни.'
  )
  const currencyChangeAlert = (
    'Промяната на името на валутата, съкращението на валутата, делителя на единиците ' +
    'или броя на показваните десетични знаци при валута, която вече се използва, '+
    'вероятно ще предизвика недоверие и може да разгневи потребителите на вашата валута.'
  )

  let actionManager = app.createActionManager(action, createUpdatedAction)
  let shakingElement: HTMLElement

  let interestRate: unknown = action.interestRate ?? 0
  let summary: string = action.debtorInfo?.summary ?? ''
  let debtorName:string = action.debtorInfo?.debtorName ?? ''
  let debtorHomepageUri: string = removeHttpsPrefix(action.debtorInfo?.debtorHomepage?.uri)
  let amountDivisor: unknown = action.debtorInfo?.amountDivisor ?? DEFAULT_AMOUNT_DIVISOR
  let decimalPlaces: unknown = calcDecimalPlacesNumber(action.debtorInfo?.decimalPlaces ?? DEFAULT_DECIMAL_PLACES)
  let unit: string = action.debtorInfo?.unit ?? DEFAULT_PEG_ABBR
  let peg: Peg | undefined = action.debtorInfo?.peg

  let invalidCurrencyName: boolean
  let invalidCurrencyAbbreviation: boolean
  let invalidHomepage: boolean
  let invalidInterestRate: boolean
  let invalidAmountDivisor: boolean
  let invalidDecimalPlaces: boolean
  let invalidPeg: boolean

  function createUpdatedAction(): UpdateConfigActionWithId {
    return {
      ...action,
      interestRate: Number(interestRate),
      debtorInfo: {
        summary: summary || undefined,
        debtorName,
        debtorHomepage: debtorHomepageUri ? { uri: `https://${debtorHomepageUri}` } : undefined,
        amountDivisor: Number(amountDivisor),
        decimalPlaces: calcDecimalPlacesBigint(decimalPlaces),
        unit,
        peg,
      }
    }
  }

  function submit(): void {
    app.startInteraction()
    const original = action.originalDebtorInfo
    if (invalid) {
      if (shakingElement.className === '') {
        shakingElement.className = 'shaking-block'
        setTimeout(() => { shakingElement.className = '' }, 1000)
      }
    } else if (!isDivisorAdequate) {
      app.addAlert(new Alert('Посоченият делител на единиците е в конфликт с '
        + 'посочения брой десетични знаци. За да решите този проблем, можете да '
        + 'увеличите делителя на единиците или да намалите броя на десетичните знаци.'
      ))
    } else if (mustConfigurePeg && !peg) {
      // When there are a default peg, make sure that the user has
      // configured a peg during the initial currency setup. If users
      // really want to configure no peg (very unlikely), they may
      // choose the default peg during the initial currency setup, and
      // remove the peg afterwards.
      app.addAlert(new Alert(currencyNoPegAlert))
    } else if (
      (peg || confirm(currencyNoPegAlert)) &&
      (
        !original || (
          original.debtorName === debtorName &&
          original.unit === unit &&
          original.amountDivisor === Number(amountDivisor) &&
          original.decimalPlaces === calcDecimalPlacesBigint(decimalPlaces)
        ) || confirm(currencyChangeAlert)
      )
    ) {
      actionManager.execute()
    }
  }

  function dismiss(): void {
    app.startInteraction()
    actionManager.remove()
  }

  function removeHttpsPrefix(url: string = ''): string {
    return url.startsWith('https://') ? url.slice(8) : ''
  }

  function calcDecimalPlacesNumber(x: unknown): number {
    const n = Number(x)
    if (Number.isFinite(n) && -20 <= n && n <= 20) {
      return Math.round(n)
    }
    return NaN
  }

  function calcDecimalPlacesBigint(x: unknown) {
    const n = calcDecimalPlacesNumber(x)
    if (Number.isFinite(n)) {
      return BigInt(n)
    }
    return 999999n  // This is a random invalid value.
  }

  function checkDivisor(amountDivisor: unknown, decimalPlaces: unknown): boolean {
    const places = calcDecimalPlacesNumber(decimalPlaces)
    const divisor = Number(amountDivisor)
    const minDivisor = Math.pow(10, places)
    const isExactDivisor = places <= 9 && divisor === minDivisor
    const isBigEnoughDivisor = divisor >= 2 * minDivisor
    return isExactDivisor || isBigEnoughDivisor
  }

  $: invalid = (
    invalidCurrencyName ||
    invalidCurrencyAbbreviation ||
    invalidHomepage ||
    invalidInterestRate ||
    invalidAmountDivisor ||
    invalidDecimalPlaces ||
    invalidPeg
  )
  $: exampleAbbr = DEFAULT_PEG_ABBR || 'USD'
  $: isDivisorAdequate = checkDivisor(amountDivisor, decimalPlaces)
  $: mustConfigurePeg = DEFAULT_PEG_ABBR && DEFAULT_PEG_COIN && !action.originalDebtorInfo
</script>

<style>
  .fab-container {
    margin: 16px 16px;
  }

  .recommendation-container {
    margin-top: 0.8em;
    margin-bottom: 0.8em;
    line-height: 1.25;
    color: #666;
  }
  .recommendation-container strong {
    font-weight: bold;
  }

  .shaking-container {
    position: relative;
    overflow: hidden;
  }

  @keyframes shake {
    0% { transform: translate(1px, 1px) rotate(0deg); }
    10% { transform: translate(-1px, -2px) rotate(-1deg); }
    20% { transform: translate(-3px, 0px) rotate(1deg); }
    30% { transform: translate(3px, 2px) rotate(0deg); }
    40% { transform: translate(1px, -1px) rotate(1deg); }
    50% { transform: translate(-1px, 2px) rotate(-1deg); }
    60% { transform: translate(-3px, 1px) rotate(0deg); }
    70% { transform: translate(3px, 1px) rotate(-1deg); }
    80% { transform: translate(-1px, -1px) rotate(1deg); }
    90% { transform: translate(1px, 2px) rotate(0deg); }
    100% { transform: translate(1px, -2px) rotate(-1deg); }
  }

  :global(.shaking-block) {
    animation: shake 0.5s;
    animation-iteration-count: 1;
  }
</style>

<div class="shaking-container">
  <Page title="Управление на валута">
    <div bind:this={shakingElement} slot="content">
      <form
        noValidate
        autoComplete="off"
        on:input={() => actionManager.markDirty()}
        on:change={() => actionManager.save()}
        >

        <LayoutGrid>
          <Cell spanDevices={{ desktop: 6, tablet: 4, phone: 4 }}>
            <Textfield
              required
              variant="outlined"
              style="width: 100%"
              input$maxlength="40"
              bind:invalid={invalidCurrencyName}
              bind:value={debtorName}
              label="Име на валутата"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidCurrencyName}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                Трябва да е ясно и уникално, с малка вероятност за
                случайно дублиране. Ако не сте сигурни, въведете
                вашето име или името на вашия бизнес.
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 6, tablet: 4, phone: 4 }}>
            <Textfield
              required
              variant="outlined"
              style="width: 100%"
              input$maxlength="4"
              input$spellcheck="false"
              bind:invalid={invalidCurrencyAbbreviation}
              bind:value={unit}
              label="Съкращение на валутата"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidCurrencyAbbreviation}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                Това ще се показва веднага след изписаната сума
                („{amountToLocaleString(50000n, 100, 2)} {exampleAbbr}“ например).
                Ако вашата валута има утвърдено име, въведете нейното
                съкращение тук. Ако вашата валута представлява
                заместител на добре известна валута, използвайте
                съкращението на тази валута (например „{exampleAbbr}“).
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
            <Textfield
              variant="outlined"
              style="width: 100%"
              input$maxlength="192"
              input$pattern={homepagePattern}
              input$spellcheck="false"
              bind:invalid={invalidHomepage}
              bind:value={debtorHomepageUri}
              label="Уебсайт"
              prefix="https://"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidHomepage}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                Сигурна уеб страница, на която потребителите на вашата
                валута могат да научат повече за нея (по избор).
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
            <Textfield
              textarea
              variant="outlined"
              input$maxlength="500"
              style="width: 100%"
              bind:value={summary}
              label="Кратко описание"
              >
              <CharacterCounter slot="internalCounter">0 / 500</CharacterCounter>
              <HelperText slot="helper" persistent>
                Кратко описание на вашата дигитална валута (по избор).
                Потребителите ще го виждат, когато добавят вашата
                валута към своя портфейл.
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 6, tablet: 4, phone: 4 }}>
            <Textfield
              required
              variant="outlined"
              type="number"
              input$min="-50"
              input$max="100"
              input$step="any"
              style="width: 100%"
              withTrailingIcon={invalidInterestRate}
              bind:value={interestRate}
              bind:invalid={invalidInterestRate}
              label="Лихвен процент"
              suffix="%"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidInterestRate}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                Годишният лихвен процент, който се начислява върху
                средствата на потребителите на валутата. Той трябва да
                бъде число между -50 и 100. Ако не сте сигурни,
                оставете го на 0.
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 3, tablet: 2, phone: 2 }}>
            <Textfield
              required
              variant="outlined"
              type="number"
              input$min={1e-60}
              input$max={1e60}
              input$step="any"
              style="width: 100%"
              withTrailingIcon={invalidAmountDivisor}
              bind:value={amountDivisor}
              bind:invalid={invalidAmountDivisor}
              label="Делител на единиците"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidAmountDivisor}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                За да се избегнат грешки при закръгляване, сумите се
                съхраняват като цели числа. Преди да бъдат показани,
                тези цели числа се делят на това число.
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 3, tablet: 2, phone: 2 }}>
            <Textfield
              required
              variant="outlined"
              type="number"
              input$min="-20"
              input$max="20"
              input$step="1"
              style="width: 100%"
              withTrailingIcon={invalidDecimalPlaces}
              bind:value={decimalPlaces}
              bind:invalid={invalidDecimalPlaces}
              label="Брой десетични знаци"
              >
              <svelte:fragment slot="trailingIcon">
                {#if invalidDecimalPlaces}
                  <TextfieldIcon class="material-icons">error</TextfieldIcon>
                {/if}
              </svelte:fragment>
              <HelperText slot="helper" persistent>
                Броят на цифрите, които се показват след десетичната
                запетая. Трябва да бъде число между -20 и 20.
              </HelperText>
            </Textfield>
          </Cell>

          <Cell spanDevices={{ desktop: 12, tablet: 8, phone: 4 }}>
            <div class="recommendation-container">
              <strong>Важно:</strong>
              {#if mustConfigurePeg}
                Трябва да зададете фиксиран курс на обмен между вашата
                валута и добре известна валута, като например
                {DEFAULT_PEG_ABBR}.
              {:else}
                Препоръчително е да зададете фиксиран курс на обмен
                между вашата валута и добре известна
                {#if DEFAULT_PEG_ABBR}
                  валута, като например {DEFAULT_PEG_ABBR}.
                {:else}
                  валута.
                {/if}
              {/if}
            </div>
            <PegInput
              {unit}
              amountDivisor={Number(amountDivisor)}
              bind:value={peg}
              bind:invalid={invalidPeg}
              on:changed={() => actionManager.save()}
              />
          </Cell>
        </LayoutGrid>
      </form>
    </div>

    <svelte:fragment slot="floating">
      <div class="fab-container">
        <Fab on:click={dismiss} extended>
          <Label>Отхвърли</Label>
        </Fab>
      </div>
      <div class="fab-container">
        <Fab color="primary" on:click={submit} extended>
          <Icon class="material-icons">storage</Icon>
          <Label>Запази</Label>
        </Fab>
      </div>
    </svelte:fragment>
  </Page>
</div>
