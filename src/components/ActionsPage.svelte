<script lang="ts">
  import {
    DOWNLOADED_QR_COIN_KEY,
    IS_A_NEWBIE_KEY,
    HAS_LOADED_PAYMENT_REQUEST_KEY,
    INSTALL_WALLET_URL,
  } from '../app-state'
  import type { AppState, ActionsModel } from '../app-state'
  import type { ActionRecordWithId } from '../operations'
  import Fab, { Icon } from '@smui/fab';
  import LayoutGrid, { Cell } from '@smui/layout-grid'
  import ActionCard from './ActionCard.svelte'
  import Checkbox from '@smui/checkbox'
  import FormField from '@smui/form-field'
  import Paper, { Title, Content } from '@smui/paper'
  import Page from './Page.svelte'
  import Card, { Actions, Content as CardContent } from '@smui/card'
  import Button, { Label } from '@smui/button'
  import MakePaymentDialog from './MakePaymentDialog.svelte'

  export let app: AppState
  export let model: ActionsModel
  export const snackbarBottom: string = '84px'

  const SHOW_FOREIGN_ACTIONS_KEY = 'debtors.showForeignActions'
  const debtorConfigData = app.getDebtorConfigData()
  const scrollElement = document.documentElement
  const downloadedQrCoin = localStorage.getItem(DOWNLOADED_QR_COIN_KEY) === 'true'
  let isANewbie = localStorage.getItem(IS_A_NEWBIE_KEY) === 'true'
  let showForeignActions = localStorage.getItem(SHOW_FOREIGN_ACTIONS_KEY) === 'true'
  let hasLoadedPaymentRequest = localStorage.getItem(HAS_LOADED_PAYMENT_REQUEST_KEY) === 'true'
  let showMakePaymentDialog = false

  function separateForeignActions(allActions: ActionRecordWithId[]): [ActionRecordWithId[], ActionRecordWithId[]] {
    let regularActions = []
    let foreignActions = []
    for (const action of allActions) {
      if (action.actionType === 'AbortTransfer' && !action.transfer.originatesHere) {
        foreignActions.push(action)
      } else {
        regularActions.push(action)
      }
    }
    return [regularActions, foreignActions]
  }

  function showAction(actionId: number): void {
    const scrollTop = scrollElement.scrollTop
    const scrollLeft = scrollElement.scrollLeft
    app.showAction(actionId, () => {
      app.pageModel.set({ ...model, scrollTop, scrollLeft })
    })
  }

  function showTransfers(): void {
    app.startInteraction()
    app.showTransfers()
  }

  function showConfig(): void {
    app.startInteraction()
    app.showConfig()
  }

  function editConfig(): void {
    app.startInteraction()
    app.editConfig(debtorConfigData)
  }

  function scanPaymentRequest(): void {
    app.startInteraction()
    showMakePaymentDialog = true
  }

  $: actions = model.actions
  $: [regularActions, foreignActions] = separateForeignActions($actions)
  $: hasRegularActions = regularActions.length > 0
  $: hasForeignActions = foreignActions.length > 0
  $: hasConfiguredCurrency = debtorConfigData.debtorInfo !== undefined
  $: localStorage.setItem(SHOW_FOREIGN_ACTIONS_KEY, String(showForeignActions))
  $: suggestQrCoinDownload = isANewbie && hasConfiguredCurrency && !hasRegularActions && !downloadedQrCoin
  $: if (!hasConfiguredCurrency) {
    localStorage.setItem(IS_A_NEWBIE_KEY, 'true')
    isANewbie = true
  }
</script>

<style>
  .fab-container {
    margin: 16px 16px;
  }
  .no-actions {
    --no-actions-color: #888;
    font-size: 1.25em;
    margin: 36px 18px 26px 18px;
    text-align: center;
    color: var(--no-actions-color);
  }
  .to-make-payment {
    margin-top: 0.75em;
    font-weight: bold;
    font-size: 1.1em;
  }
  ol {
    list-style: decimal outside;
    margin: 0.5em 1.25em 1.25em 1.25em;
  }
  li {
    margin: 0.25em 0;
  }
  .to-install-wallet {
    margin-top: 0.75em;
    font-weight: bold;
  }
</style>

<Page title="Действия" scrollTop={model.scrollTop} scrollLeft={model.scrollLeft}>
  <svelte:fragment slot="content">
    {#if hasRegularActions }
      <LayoutGrid>
        {#each regularActions as action (action.actionId)}
          <Cell>
            <ActionCard {action} show={() => showAction(action.actionId)} />
          </Cell>
        {/each}
      </LayoutGrid>
    {:else}
      {#if hasConfiguredCurrency}
        {#if suggestQrCoinDownload}
          <LayoutGrid>
            <Cell>
              <Paper elevation={8} style="margin-bottom: 16px">
                <Title>Поздравления!</Title>
                <Content>
                  Успешно настроихте вашата дигитална валута. Натиснете бутона
                  <Icon style="vertical-align: middle" class="material-icons">settings_applications</Icon>
                  по-долу, за да видите вашата дигитална монета.
                </Content>
              </Paper>
            </Cell>
          </LayoutGrid>
        {:else}
          {#if !isANewbie || hasLoadedPaymentRequest}
            <p class="no-actions">
              Натиснете бутона
              <Icon class="material-icons" style="vertical-align: middle">local_atm</Icon>
              по-долу, за да заредите покана за плащане и да пуснете нови пари в обращение.
            </p>
          {:else}
            <LayoutGrid>
              <Cell span={12}>
                <Paper elevation={8} style="margin-bottom: 16px">
                  <Title>Как да пусна валутата си в обращение?</Title>
                  <Content>
                    <p>
                      За да разполагате с каквато сума пожелаете във
                      вашата собствена валута, първо
                      {#if INSTALL_WALLET_URL}
                        <a href="{INSTALL_WALLET_URL}" target="_blank" rel="noreferrer">
                          трябва да инсталирате портфейл за дигитални валути.
                        </a>
                      {:else}
                        трябва да инсталирате портфейл за дигитални валути.
                      {/if}
                    </p>
                    <p class="to-make-payment">За да заредите портфейла си:</p>
                    <ol>
                      <li>В портфейла открийте сметка в собствената си валута.</li>
                      <li>В портфейла направете покана за плащане към себе си.</li>
                      <li>
                        Натиснете бутона
                        <Icon class="material-icons" style="margin: 0 0.15em; vertical-align: middle">local_atm</Icon>
                        по-долу и заредете поканата за плащане.
                      </li>
                      <li>Потвърдете плащането.</li>
                    </ol>
                    <p>
                      За да видите QR кода на валутата си,
                      можете да използвате бутона
                      <Icon class="material-icons" style="margin: 0 0.15em; vertical-align: middle">settings_applications</Icon>
                      по-долу.
                    </p>
                  </Content>
                </Paper>
              </Cell>
            </LayoutGrid>
          {/if}
        {/if}
      {:else}
        <LayoutGrid>
          <Cell>
            <Paper elevation={8} style="margin-bottom: 16px">
              <Title>Нови ли сте в {appConfig.siteTitle}?</Title>
              <Content>
                Всеки път, когато отваряте това приложение, първо ще
                виждате екрана „Действия“. Този екран показва неща,
                които изискват вашето внимание, като действия, които
                са започнати, но все още не са завършени.
              </Content>
            </Paper>
          </Cell>
          <Cell>
            <Card>
              <CardContent>
                За вас бе създадена нова дигитална валута. Преди да
                можете да я използвате, е необходимо да въведете
                основна информация, като име на валутата, лихвен
                процент и някои други настройки.
              </CardContent>
              <Actions fullBleed>
                <Button on:click={editConfig}>
                  <Label>Управление на валута</Label>
                  <i class="material-icons" aria-hidden="true">arrow_forward</i>
                </Button>
              </Actions>
            </Card>
          </Cell>
        </LayoutGrid>
      {/if}
    {/if}
    {#if hasForeignActions}
      <LayoutGrid>
        <Cell span={12}>
          <FormField>
            <Checkbox bind:checked={showForeignActions} />
            <span slot="label">Покажи проблемни плащания, започнати от други устройства.</span>
          </FormField>
        </Cell>
        {#if showForeignActions }
          {#each foreignActions as action (action.actionId)}
            <Cell>
              <ActionCard color="secondary" {action} show={() => showAction(action.actionId)} />
            </Cell>
          {/each}
        {/if}
      </LayoutGrid>
    {/if}

    <MakePaymentDialog bind:open={showMakePaymentDialog}/>
  </svelte:fragment>

  <svelte:fragment slot="floating">
    <div class="fab-container">
      <Fab on:click={showTransfers}>
        <Icon class="material-icons">history</Icon>
      </Fab>
    </div>
    <div class="fab-container">
      <Fab
        color={!suggestQrCoinDownload && hasConfiguredCurrency ? "primary" : "secondary"}
        on:click={scanPaymentRequest}
        >
        <Icon class="material-icons">local_atm</Icon>
      </Fab>
    </div>
    <div class="fab-container">
      <Fab color="primary" on:click={showConfig}>
        <Icon class="material-icons">settings_applications</Icon>
      </Fab>
    </div>
  </svelte:fragment>
</Page>
