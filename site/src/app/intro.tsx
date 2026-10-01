import { Button } from "@/components/Button";
import { Panel, Eyebrow } from "@/components/Panel";
import { OWNER_TELEGRAM_URL } from "@/lib/contract";

const STEPS = [
  "Владелец создаёт награду и подписывает её в MetaMask",
  "Получатель получает одноразовую ссылку",
  "Открывает её, подключает кошелёк и забирает ALE",
];

type IntroProps = {
  onConnect: () => void;
  connectBusy: string | null;
};

export function Intro({ onConnect, connectBusy }: IntroProps) {
  return (
    <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr]">
      <div>
        <Eyebrow>Токен ALE · Polygon</Eyebrow>
        <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
          Награды, которые выдаются вручную
        </h1>
        <p className="mt-4 max-w-prose text-muted">
          Владелец подписывает награду в своём кошельке, а получатель забирает токены по
          одноразовой ссылке. Без сервера и базы данных — всё проверяет смарт-контракт.
        </p>
        <Button onClick={onConnect} busy={connectBusy} className="mt-6">
          Подключить кошелёк
        </Button>
      </div>
      <Panel title="Как это работает">
        <ol className="grid gap-4">
          {STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3">
              <span className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-glow text-sm font-semibold text-amber">
                {index + 1}
              </span>
              <span className="text-muted">{step}</span>
            </li>
          ))}
        </ol>
      </Panel>
      <p className="text-sm text-muted md:col-span-2">
        Получили ссылку на награду? Просто откройте её. Ссылки нет — напишите владельцу в{" "}
        <a
          href={OWNER_TELEGRAM_URL}
          {...(OWNER_TELEGRAM_URL.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="underline decoration-cream/30 underline-offset-2 transition hover:text-amber hover:decoration-amber"
        >
          Telegram
        </a>
        .
      </p>
    </div>
  );
}
