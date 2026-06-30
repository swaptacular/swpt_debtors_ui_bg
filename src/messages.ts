// Messages for payment error codes:
export const CANCELED_BY_THE_SENDER = "Плащането е отменено от платеца."
export const SENDER_IS_UNREACHABLE = "Сметката на платеца не съществува или не може да извършва изходящи преводи."
export const RECIPIENT_IS_UNREACHABLE = "Сметката на получателя не съществува или не приема входящи плащания."
export const RECIPIENT_SAME_AS_SENDER = "Сметката на получателя е същата като сметката на платеца."
export const NO_RECIPIENT_CONFIRMATION = "Необходимо е потвърждение от получателя, но такова не е получено."
export const TRANSFER_NOTE_IS_TOO_LONG = "Броят байтове на бележката към плащането е твърде голям."
export const INSUFFICIENT_AVAILABLE_AMOUNT = "Исканата сума не е налична в сметката на платеца."
export const TIMEOUT = "Плащането е прекратено поради изтекъл срок."
export const NEWER_INTEREST_RATE = (
  "Плащането е прекратено, защото текущият лихвен процент по сметката е по-нов" +
  " от посоченото време за лихвения процент."
)

// Operational alerts:
export const OPERATION_REQUIRES_AUTHENTICATION = "Тази операция изисква оторизация. Ще бъдете пренасочени към страницата за вход."
export const PROBLEM_ON_THE_SERVER = "Възникна проблем със сървъра. Моля, опитайте отново по-късно."
export const NETWORK_PROBLEM = "Възникна мрежов проблем. Моля, проверете интернет връзката си."
export const UNEXPECTED_ERROR = "Опа! Нещо се обърка."
export const INVALID_PAYMENT_REQUEST = (
  "Невалидна покана за плащане. Уверете се, че сканирате правилния" +
  " QR код за съответната покана за плащане."
)

// This message will be shown when the user wants to view the details of a
// payment (a transfer) that the user has made, but for some reason
// the payment do not exist.
export const PAYMENT_DOES_NOT_EXIST = "Заявената транзакция не съществува."

// Problems with handling "Actions":
export const CAN_NOT_PERFORM_ACTOIN = "Заявеното действие не може да бъде извършено."
export const CAN_NOT_DISMISS_ACTION = "Действието не може да бъде отхвърлено."
export const ACTION_DOES_NOT_EXIST = "Заявеното действие не съществува."

// Generates a message to be shown in a tooltip. Change this function
// to return a translated string. Also, make sure to pass your locale
// as a parameter in the calls to `toLocaleString()` that this
// function makes (`.toLocaleString('bg-BG')` for example).
export function getTooltip(t: any): string {
  const initiatedAt = new Date(t.initiatedAt).toLocaleString('bg-BG')
  if (t.result) {
    const finalizedAt = new Date(t.result.finalizedAt).toLocaleString('bg-BG')
    if (t.result.error) {
      const reason = getFailureReason(t.result.error.errorCode)
      return `Плащането е започнало на ${initiatedAt}`
        + ` и е завършило неуспешно на ${finalizedAt}.`
        + ` Причината за неуспеха е: „${reason}“.`
    } else {
      const paymentRefernece = t.paymentInfo.payeeReference
      if (paymentRefernece) {
        const maxLength = 64
        const shortRef = paymentRefernece.length <= maxLength
          ? paymentRefernece
          : `${paymentRefernece.slice(0, maxLength)}...`
        return `Плащането е започнало на ${initiatedAt}`
          + ` и е завършило успешно на ${finalizedAt}.`
          + ` Идентификатор на плащането: „${shortRef}“.`
      } else {
        return `Плащането е започнало на ${initiatedAt}`
          + ` и е завършило успешно на ${finalizedAt}.`
      }
    }
  }
  return `Плащането е започнало на ${initiatedAt}.`
}

function getFailureReason(errorCode: string): string {
  switch (errorCode) {
    case 'CANCELED_BY_THE_SENDER':
      return CANCELED_BY_THE_SENDER
    case 'SENDER_IS_UNREACHABLE':
      return SENDER_IS_UNREACHABLE
    case 'RECIPIENT_IS_UNREACHABLE':
      return RECIPIENT_IS_UNREACHABLE
    case 'RECIPIENT_SAME_AS_SENDER':
      return RECIPIENT_SAME_AS_SENDER
    case 'NO_RECIPIENT_CONFIRMATION':
      return NO_RECIPIENT_CONFIRMATION
    case 'TRANSFER_NOTE_IS_TOO_LONG':
      return TRANSFER_NOTE_IS_TOO_LONG
    case 'INSUFFICIENT_AVAILABLE_AMOUNT':
      return INSUFFICIENT_AVAILABLE_AMOUNT
    case 'TIMEOUT':
      return TIMEOUT
    case 'NEWER_INTEREST_RATE':
      return NEWER_INTEREST_RATE
    default:
      return errorCode
  }
}
