<script lang="ts">
  import { getTooltip } from '../messages'
  import type { AppState } from '../app-state'
  import type { AbortTransferActionWithId } from '../operations'
  import Fab, { Label } from '@smui/fab';
  import Button, { Label as ButtonLabel } from '@smui/button'
  import { Title, Content, Actions, InitialFocus } from '@smui/dialog'
  import Dialog from './Dialog.svelte'
  import PaymentInfo from './PaymentInfo.svelte'
  import Page from './Page.svelte'

  export let app: AppState
  export let action: AbortTransferActionWithId
  export const snackbarBottom: string = "84px"

  let showFailedCancellationDialog = false

  function retry() {
    app.startInteraction()
    app.retryTransfer(action)
  }

  function dismiss() {
    app.startInteraction()
    app.dismissTransfer(action)
  }

  function cancel() {
    app.startInteraction()
    app.cancelTransfer(action, () => { showFailedCancellationDialog = true })
  }

  function closeDialog() {
    showFailedCancellationDialog = false
  }

  $: transfer = action.transfer
  $: payeeName = transfer.paymentInfo.payeeName
  $: payeeReference = transfer.paymentInfo.payeeReference
  $: unitAmount = app.amountToString(transfer.amount)
  $: description = transfer.paymentInfo.description
  $: title = transfer.result ? "Неуспешно плащане" : "Забавено плащане"
  $: tooltip = getTooltip(transfer)
</script>

<style>
  .fab-container {
    margin: 16px 16px;
  }
</style>

<Page title={title}>
  <svelte:fragment slot="content">
    <PaymentInfo
      {payeeName}
      {payeeReference}
      {unitAmount}
      {description}
      {title}
      {tooltip}
      unit={app.unit}
      />

    {#if showFailedCancellationDialog}
      <Dialog
        open
        scrimClickAction=""
        aria-labelledby="failed-cancellation-title"
        aria-describedby="failed-cancellation-content"
        on:MDCDialog:closed={closeDialog}
        >
        <Title id="failed-cancellation-title">Неуспешна отмяна на плащане</Title>
        <Content id="failed-cancellation-content">
          Опитът за отмяна на забавеното плащане беше неуспешен.
          Можете да премахнете това плащане, но имайте предвид, че не
          е сигурно дали прехвърлянето на сумата е било успешно или
          не.
        </Content>
        <Actions>
          <Button on:click={dismiss}>
            <ButtonLabel>Премахни плащането</ButtonLabel>
          </Button>
          <Button default use={[InitialFocus]}>
            <ButtonLabel>OK</ButtonLabel>
          </Button>
        </Actions>
      </Dialog>
    {/if}
  </svelte:fragment>

  <svelte:fragment slot="floating">
    {#if transfer.result}
      <div class="fab-container">
        <Fab on:click={retry} extended>
          <Label>Опитай отново</Label>
        </Fab>
      </div>
      <div class="fab-container">
        <Fab color="primary" on:click={dismiss} extended>
          <Label>Отхвърли</Label>
        </Fab>
      </div>
    {:else}
      <div class="fab-container">
        <Fab color="primary" on:click={cancel} extended>
          <Label>Отменени плащането</Label>
        </Fab>
      </div>
    {/if}
  </svelte:fragment>
</Page>
