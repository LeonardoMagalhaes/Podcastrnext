// SPA - Single Page Application - Precisa do javascript habilitado do lado do cliente
// SSR - Server Side Rendering - Processamento, do lado do SERVIDOR, feito toda vez que a pagina eh acessada.
// SSG - Static Site Generation - É gerada uma página estática somente uma vez em HTML puro podendo ser acessada sem novos processamentos, sem necessidade de novas requisições.

// import { useEffect } from "react"
import { GetStaticProps } from 'next';
import Image from 'next/image';
import Head from 'next/head';
import Link from 'next/link';
import { api } from '../services/api';
import { format, parseISO } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import { convertDurationTimeString } from '../utils/convertDurationToTimeString';

import styles from './home.module.scss';
import { usePlayer } from '../contexts/PlayerContexts';

type Episode = {
  id: string;
  title: string;
  thumbnail: string;
  members: string;
  publishedAt: string;
  duration: number;
  durationAsString: string;
  url: string;
};

type HomeProps = {
  latestEpisodes: Episode[],
  allEpisodes: Episode[]
};

export default function Home({ latestEpisodes, allEpisodes }: HomeProps) {
  // SPA -- essa versão não executa sem o javascript habilitado no browser do cliente
  // useEffect(() => {
  //   fetch('http://localhost:3333/episodes')
  //     .then(response => response.json())
  //     .then(data => console.log(data))
  // }, [])

  const { playList } = usePlayer();

  const episodeList = [...latestEpisodes, ...allEpisodes];
  
  return (
    <div className={ styles.homepage }>
      <Head>
        <title>Home | Podcastr</title>
      </Head>

      <section className={ styles.latestEpisodes }>
        <h2>Últimos lançamentos</h2>

        <ul>
          { latestEpisodes.map((episode, index) => {
            return (
              <li key={ episode.id }>
                <Image
                  width={192}
                  height={192}
                  src={ episode.thumbnail }
                  alt={ episode.title }
                  objectFit="cover"
                />

                <div className={ styles.episodeDetails }>
                  <Link href={`/episodes/${episode.id}`}>
                    <a>{episode.title}</a>
                  </Link>
                  <p>{ episode.members }</p>
                  <span>{ episode.publishedAt }</span>
                  <span>{ episode.durationAsString }</span>
                </div>

                <button type="button" onClick={() => playList(episodeList, index)}>
                  <img src="/play-green.svg" alt="Tocar episódio" />
                </button>
              </li>
            )
          })}
        </ul>
      </section>

      <section className={ styles.allEpisodes }>
        <h2>Todos episódios</h2>

        <table cellSpacing={0}>
          <thead>
            <tr>
              <th></th>
              <th>Podcast</th>
              <th>Integrantes</th>
              <th>Data</th>
              <th>Duração</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            { allEpisodes.map((episode, index) => {
              return (
                <tr key={ episode.id }>
                  <td style={{ width: 72 }}>
                    <Image
                      width={120}
                      height={120}
                      src={episode.thumbnail}
                      alt={episode.title}
                      objectFit="cover"
                    />
                  </td>
                  <td>
                    <a href={`/episodes/${episode.id}`}>{episode.title}</a>
                  </td>
                  <td>{episode.members}</td>
                  <td style={{ width: 100 }}>{episode.publishedAt}</td>
                  <td>{episode.durationAsString}</td>
                  <td>
                    <button type="button" onClick={() => playList(episodeList, index + latestEpisodes.length)}>
                      <img src="/play-green.svg" alt="Tocar episódio"/>
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}

// SSR - Carrega os dados no lado do servidor. Pode desabilitar o javascript no browser do cliente que os dados vao continuar sendo processados.
// getServerSideProps - vai ser executado toda vez que for acessado a pagina em questao. SSR
// getStaticProps - pra gerar uma pagina estatica -SSG
export  const getStaticProps: GetStaticProps = async () => {
  const { data } = await api.get('episodes', {
    params: {
      _limit: 12,
      _sort: 'published_at',
      _order: 'desc'
    }
  });

  // Para que o componente receba os dados já tratados (como horas por exemplo), é melhor fazê-lo na entrada da API para que o componente não fique atualizando desnecessariamente.

  const episodes = data.map(episode => {
    return {
      id: episode.id,
      title: episode.title,
      thumbnail: episode.thumbnail,
      members: episode.members,
      publishedAt: format(parseISO(episode.published_at), 'd MMM yy', { locale: ptBR }),
      duration: Number(episode.file.duration),
      durationAsString: convertDurationTimeString(Number(episode.file.duration)),
      url: episode.file.url
    }
  })

  const latestEpisodes = episodes.slice(0, 2);
  const allEpisodes = episodes.slice(2, episodes.length);

  return {
    props: {
      latestEpisodes,
      allEpisodes,
    },
    revalidate: 60 * 60 * 8,
  }
}
