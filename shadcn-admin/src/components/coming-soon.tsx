import { IconPlanet } from '@tabler/icons-react'

export default function ComingSoon() {
  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <IconPlanet size={72} />
        <h1 className='text-4xl leading-tight font-bold'>Скоро будет 👀</h1>
        <p className='text-muted-foreground text-center'>
          Эта страница еще не создана. <br />
          Следите за обновлениями!
        </p>
      </div>
    </div>
  )
}
