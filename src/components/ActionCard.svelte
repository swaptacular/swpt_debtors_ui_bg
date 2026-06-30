<script lang="ts">
  import { getContext } from 'svelte'
  import { fly, fade } from 'svelte/transition'
  import type { ActionRecordWithId } from '../operations'
  import type { AppState } from '../app-state'
  import Button, { Label } from '@smui/button'
  import Card, { Content, Actions } from '@smui/card'

  const app: AppState = getContext('app')
  const debtorConfigData = app.getDebtorConfigData()

  export let action: ActionRecordWithId
  export let show = () => { app.showAction(action.actionId) }
  export let color: string = 'primary'

  function activate(): void {
    app.startInteraction()
    show()
  }

  function getButtonLabel(action: ActionRecordWithId): string {
    switch (action.actionType) {
    case 'CreateTransfer':
      return 'Плати'
    case 'AbortTransfer':
      return action.transfer.result ? "Покажи неуспешното плащане" : "Покажи забавеното плащане"
    case 'UpdateConfig':
      return 'Управление на валута'
    default:
      return 'Неизвестен вид действие'
    }
  }

  function getDescription(action: ActionRecordWithId): string {
    let payeeName
    let unitAmount
    let unit
    switch (action.actionType) {
    case 'CreateTransfer':
      payeeName = action.paymentInfo.payeeName
      unitAmount = app.amountToLocaleString(action.creationRequest.amount)
      unit = debtorConfigData.debtorInfo?.unit ?? '\u00a4'
      return `Плати ${unitAmount} ${unit} на ${payeeName}.`
    case 'AbortTransfer':
      const transfer = action.transfer
      const title = transfer.result ? "Неуспешно плащане" : "Забавено плащане"
      payeeName = transfer.paymentInfo.payeeName
      unitAmount = app.amountToLocaleString(transfer.amount)
      unit = debtorConfigData.debtorInfo?.unit ?? '\u00a4'
      return `${title}: ${unitAmount} ${unit} на ${payeeName}.`
    case 'UpdateConfig':
      return 'Въведете информация за вашата валута.'
    default:
      return 'Неизвестен вид действие'
    }
  }
</script>

<div in:fly|local="{{ x: -350, duration: 1000 }}" out:fade|local="{{ duration: 1000 }}">
  <Card>
    <Content>{getDescription(action)}</Content>
    <Actions fullBleed>
      <Button {color} on:click={activate}>
        <Label>{getButtonLabel(action)}</Label>
        <i class="material-icons" aria-hidden="true">arrow_forward</i>
      </Button>
    </Actions>
  </Card>
</div>
