<script lang="ts">
  import type { AppState, ConfigDataModel } from '../app-state'
  import { DOWNLOADED_QR_COIN_KEY, REGISTER_ISSUER_URL, INSTALL_WALLET_URL } from '../app-state'
  import { generatePr0Blob, IvalidPaymentData } from '../payment-requests'
  import { onDestroy } from 'svelte'
  import Fab, { Icon } from '@smui/fab';
  import Paper, { Title, Content } from '@smui/paper'
  import Page from './Page.svelte'
  import QrGenerator from './QrGenerator.svelte'

  export let app: AppState
  export let model: ConfigDataModel
  export const snackbarBottom: string = "84px"
  assert(model)

  let downloadLinkElement: HTMLAnchorElement
  let destroyLinkElement: HTMLAnchorElement
  let dataUrl: string
  let destroyUrl: string | undefined
  const debtorConfigData = app.getDebtorConfigData()
  const info = debtorConfigData.debtorInfo
  const link = `${app.publicInfoDocumentUri}#${app.debtorIdentityUri}`
  if (!info) {
    app.editConfig(debtorConfigData)
  } else {
    generateDestroyUrl(model.debtorRecord.account?.uri)
  }

  function revokeDestroyUrl() {
    if (destroyUrl) {
      URL.revokeObjectURL(destroyUrl)
    }
  }

  function generateDestroyUrl(accountUri?: string) {
    assert(info)
    let url
    if (accountUri !== undefined) {
      try {
        const blob = generatePr0Blob({
          payeeName: info.debtorName,
          payeeReference: '',
          description: {
            contentFormat: '',
            content: 'Зададената сума ще бъде унищожена.',
          },
          amount: 0n,
          accountUri,
        })
        url = URL.createObjectURL(blob)
      } catch (e: unknown) {
        if (e instanceof IvalidPaymentData) {
          console.warn('Can not generate money destruction payment request:', e)
        } else throw e
      }
    }
    revokeDestroyUrl()
    destroyUrl = url
  }

  function showActions(): void {
    app.startInteraction()
    app.showActions()
  }

  function editConfig(): void {
    app.startInteraction()
    app.editConfig(debtorConfigData)
  }

  onDestroy(() => {
    revokeDestroyUrl()

    // Set the "downloaded coin" flag to true when exiting the page.
    if (localStorage.getItem(DOWNLOADED_QR_COIN_KEY) !== 'true') {
      localStorage.setItem(DOWNLOADED_QR_COIN_KEY, 'true')
    }
  })

  $: balance = model.debtorRecord.balance
  $: totalIssuedUnits = app.amountToLocaleString(-balance)
  $: unit = app.unit
  $: currencyName = info?.debtorName ?? 'Unknown currency'
  $: downloadName = currencyName.slice(0, 120).replace(/[<>:"/|?*\\]/g, ' ')
  $: pngFileName = downloadName + '.png'
  $: pr0FileName = downloadName + '.pr0'
</script>

<style>
  .fab-container {
    margin: 16px 16px;
  }
  .download-link, .destroy-link {
    display: none;
  }
  .qrcode-container {
    width: 100%;
    text-align: center;
  }
  .qrcode-container :global(canvas) {
    width: 100%;
    max-width: 66vh;
  }
  .text-container {
    display: flex;
    width: 100%;
    justify-content: center;
  }
  ol {
    list-style: decimal outside;
    margin: 0.75em 1.25em;
  }
  li {
    margin: 0.5em 0;
  }
  .amount {
    font-size: 1.1em;
    white-space: nowrap;
  }
  em {
    font-weight: bold;
    color: #444;
  }
  p {
    margin-top: 10px;
  }
</style>

{#if info}
  <Page title={info.debtorName}>
    <svelte:fragment slot="content">
      <div class="qrcode-container">
        <QrGenerator value={link} bind:dataUrl />
      </div>
      <a class="download-link" href={dataUrl} download={pngFileName} bind:this={downloadLinkElement}>изтегли</a>
      <a class="destroy-link" href={destroyUrl} download={pr0FileName} bind:this={destroyLinkElement}>унищожи</a>

      <div class="text-container">
        <Paper elevation={8} style="margin: 0 16px 16px 16px; max-width: 600px">
          <Title>Вашата дигитална монета</Title>
          <Content>
            <p>
              Изображението по-горе (стандартен QR код) служи за
              разпознаване на вашата дигитална валута в системата.
              Всеки, който иска да използва вашата валута, включително
              вие самите, ще трябва да сканира този QR код с мобилното
              си устройство. Затова:
            </p>
            <ol>
              <li>
                <a href="download" on:click|preventDefault={() => downloadLinkElement.click()}>
                  Изтеглете изображението.
                </a>
                Уверете се, че то е публично достъпно и недвусмислено
                свързано с вас — например като го отпечатате върху
                визитките си, поставите го в офиса си или го
                публикувате на уебсайта си.
              </li>
              {#if REGISTER_ISSUER_URL}
                <li>
                  <a href="{REGISTER_ISSUER_URL}" target="_blank">
                    Добавете своя бизнес
                  </a>
                  в нашия публичен регистър, за да могат клиентите
                  лесно да ви откриват, да купуват вашата валута и
                  впоследствие да я използват за плащане на вашите
                  стоки и услуги.
                </li>
              {/if}
              {#if INSTALL_WALLET_URL}
                <li>
                  <a href="{INSTALL_WALLET_URL}" target="_blank">
                    Инсталирайте портфейл
                  </a>
                  за дигитални валути, който ще ви позволи да
                  притежавате и използвате валути (включително
                  собствената ви валута), както и да ги купувате и
                  продавате.
                </li>
              {/if}
              <li>
                <a href="issue" on:click|preventDefault={showActions}>
                  Пуснете пари в обращение.
                </a>
              </li>
            </ol>
            <p>
              В момента имате общо
              <span class="amount">{`${totalIssuedUnits} ${unit}`}</span>
              от вашата дигитална валута в обращение (възможно е тази
              стойност леко да изостава от реалната).
            </p>
            {#if destroyUrl}
              <p>
                Можете да използвате
                <a
                  href="destroy" on:click|preventDefault={() => destroyLinkElement.click()}
                  style="white-space: nowrap"
                  >
                  тази покана за плащане
                </a>
                ако искате да унищожите пари, които вече са в
                обращение.
              </p>
            {/if}
          </Content>
        </Paper>
      </div>
    </svelte:fragment>

    <svelte:fragment slot="floating">
      <div class="fab-container">
        <Fab on:click={editConfig} color="primary">
          <Icon class="material-icons">settings</Icon>
        </Fab>
      </div>
    </svelte:fragment>
  </Page>
{:else}
  <!-- Normally, this will never be shown. -->
  <Page title="Управление на валута" />
{/if}
