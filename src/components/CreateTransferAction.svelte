<script lang="ts">
  import * as msg from '../messages'
  import { MAX_INT64 } from '../app-state'
  import type { AppState } from '../app-state'
  import type { CreateTransferActionWithId, CreateTransferActionStatus } from '../operations'
  import { getCreateTransferActionStatus } from '../operations'
  import { generatePayment0TransferNote, generatePr0Blob } from '../payment-requests'
  import { onDestroy } from 'svelte'
  import Fab, { Icon, Label } from '@smui/fab';
  import Banner, { Label as BannerLabel } from '@smui/banner'
  import Button from '@smui/button'
  import PaymentInfo from './PaymentInfo.svelte'
  import Page from './Page.svelte'

  export let app: AppState
  export let action: CreateTransferActionWithId
  export const snackbarBottom: string = "84px"

  let shakingElement: HTMLElement
  let actionManager = app.createActionManager(action, createUpdatedAction)
  let payeeName: string = action.paymentInfo.payeeName
  let unitAmount: unknown = action.creationRequest.amount ? app.amountToString(action.creationRequest.amount): ''
  let invalidPayeeName: boolean | undefined = undefined
  let invalidUnitAmount: boolean | undefined = undefined
  let activeBanner: boolean = true
  let currentDataUrl: string

  function createUpdatedAction(): CreateTransferActionWithId {
    const paymentInfo = {
      ...action.paymentInfo,
      payeeName,
    }
    return {
      ...action,
      paymentInfo,
      creationRequest: {
        ...action.creationRequest,
        amount: action.requestedAmount || amountToBigint(unitAmount),
        noteFormat: action.requestedAmount ? 'PAYMENT0' : 'payment0',
        note: generatePayment0TransferNote(paymentInfo, app.noteMaxBytes),
      },
    }
  }

  function amountToBigint(amount: unknown): bigint {
    let result = 0n
    if (amount !== '') {
      let x = Number(amount)
      if (Number.isFinite(x)) {
        result = app.stringToAmount(x)
        if (result < 0n) {
          result = 0n
        }
        if (result > MAX_INT64) {
          result = MAX_INT64
        }
      }
    }
    return result
  }

  function getInfoTooltip(status: CreateTransferActionStatus): string {
    switch (status) {
    case 'Draft':
      return 'Все още не е направен опит за превеждане на сумата.'
    case 'Not sent':
      return 'Направен е опит за превеждане на сумата, но е неуспешен.'
        + ' Безопасно е да опитате отново да извършите превода.'
    case 'Not confirmed':
      return 'Направен е опит за превеждане на сумата, но не е'
        + ' известно дали тя е била успешно преведена.'
        + ' Безопасно е да опитате отново да извършите превода.'
    case 'Initiated':
      return 'Плащането е започнато.'
    case 'Failed':
      return msg.INVALID_PAYMENT_REQUEST
    case 'Timed out':
      return 'Направен е опит за превеждане на сумата, но не е известно'
        + ' дали тя е била успешно преведена. Не е безопасно да'
        + ' опитате отново да извършите превода.'
    }
  }

  function getTitle(status: CreateTransferActionStatus): string {
    switch (status) {
    case 'Draft':
      return 'Покана за плащане'
    case 'Not sent':
      return 'Неизпратено плащане'
    case 'Not confirmed':
      return 'Непотвърдено плащане'
    case 'Initiated':
      return 'Започнато плащане'
    case 'Failed':
      return 'Неуспешно плащане'
    case 'Timed out':
      return 'Плащане с изтекъл срок'
    }
  }

  function revokeCurrentDataUrl() {
    if (currentDataUrl) {
      URL.revokeObjectURL(currentDataUrl)
    }
  }

  function generateDataUrl(action: CreateTransferActionWithId): string {
    const blob = generatePr0Blob({
      ...action.paymentInfo,
      accountUri: action.creationRequest.recipient.uri,
      amount: action.requestedAmount,
      deadline: action.requestedDeadline,
    }, { mimeType: 'application/octet-stream'})
    revokeCurrentDataUrl()
    return currentDataUrl = URL.createObjectURL(blob)
  }

  function dismiss(): void {
    app.startInteraction()
    actionManager.remove()
  }

  function execute(): void {
    app.startInteraction()
    if (invalid) {
      if (shakingElement.className === '') {
        shakingElement.className = 'shaking-block'
        setTimeout(() => { shakingElement.className = '' }, 1000)
      }
    } else if (status === 'Timed out') {
      // Timed out payments can not be executed, but still must be
      // acknowledged (not dismissed), because they may have resulted
      // in a transfer.
      actionManager.remove()
    } else {
      actionManager.execute()
    }
  }

  onDestroy(revokeCurrentDataUrl)

  $: forbidAmountChange = action.requestedAmount > 0
  $: deadline = action.requestedDeadline
  $: description = action.paymentInfo.description
  $: payeeReference = action.paymentInfo.payeeReference
  $: status = getCreateTransferActionStatus(action)
  $: executeButtonLabel = (status !== 'Initiated' && status !== 'Timed out' && status !== 'Failed') ? "Плати" : 'Разбрах'
  $: executeButtonIsHidden = (status === 'Failed')
  $: dismissButtonIsHidden = (status === 'Not confirmed' || status === 'Initiated' || status === 'Timed out')
  $: showDeadlineWarning = activeBanner && deadline !== undefined && status === "Draft"
  $: title = getTitle(status)
  $: tooltip = getInfoTooltip(status)
  $: dataUrl = generateDataUrl(action)
  $: invalid = (
    invalidPayeeName ||
    invalidUnitAmount ||
    showDeadlineWarning
  )
</script>

<style>
  .fab-container {
    margin: 16px 16px;
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
  <Page title="Направи плащане">
    <div bind:this={shakingElement} slot="content">
      {#if showDeadlineWarning && deadline !== undefined}
        <Banner bind:open={activeBanner} mobileStacked centered>
          <BannerLabel slot="label">
            Поканата за плащане посочва {deadline.toLocaleString('bg-BG')}
            като краен срок за плащане. При пускане на пари в
            обращение сроковете за плащане не се вземат предвид.
          </BannerLabel>
          <svelte:fragment slot="actions">
            <Button>OK</Button>
          </svelte:fragment>
        </Banner>
      {/if}

      <form
        noValidate
        autoComplete="off"
        on:input={() => actionManager.markDirty()}
        on:change={() => actionManager.save()}
        >
        <PaymentInfo
          bind:payeeName
          bind:unitAmount
          bind:invalidPayeeName
          bind:invalidUnitAmount
          {payeeReference}
          {description}
          {title}
          {tooltip}
          {forbidAmountChange}
          {dataUrl}
          unit={app.unit}
          />
      </form>
    </div>

    <svelte:fragment slot="floating">
      {#if !dismissButtonIsHidden}
        <div class="fab-container">
          <Fab color={executeButtonIsHidden ? "primary" : "secondary"} on:click={dismiss} extended>
            <Label>Откажи</Label>
          </Fab>
        </div>
      {/if}
      {#if !executeButtonIsHidden}
        <div class="fab-container">
          <Fab color="primary" on:click={execute} extended>
            <Icon class="material-icons">monetization_on</Icon>
            <Label>{executeButtonLabel}</Label>
          </Fab>
        </div>
      {/if}
    </svelte:fragment>
  </Page>
</div>
