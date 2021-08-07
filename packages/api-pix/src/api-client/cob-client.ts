import { IJSONFetcher, FetchQueryParams, buildFetchPath } from './mod.ts';
import { Cobranca, PartialCobranca, CobType, PagedListCobParams } from '../deps.ts';

export class CobClient {
  constructor( private fetcher: IJSONFetcher, public readonly cobType: CobType, public additionalQuery?: FetchQueryParams ) {
    //
  }

  async getCobs( params: PagedListCobParams ): Promise<Cobranca[]> {
    const pag = params.paginacao ?? {};

    //Object.keys(params).forEach(key => obj[key] === undefined ? delete obj[key] : {});

    const query: Record<string,string|undefined> = {
      inicio: params?.inicio.toISOString().slice(0,-5)+"Z",
      fim: params?.fim.toISOString().slice(0,-5)+"Z",
      cpf: params.cpf,
      cnpj: params.cnpj,
      locationPresente: (params.locationPresente != undefined) ? (params.locationPresente ? "true":"false"):undefined,
      status: params.status,
      "paginacao.paginaAtual": (pag.paginaAtual !== undefined) ? ""+pag.paginaAtual : undefined,
      "paginacao.itensPorPagina": (pag.itensPorPagina !== undefined) ? ""+pag.itensPorPagina : undefined,
    };

    // remove null entries
    let q2 = Object.fromEntries(Object.entries(query).filter(([_, v]) => v != undefined)) as Record<string,string>;

    const path = buildFetchPath( `${this.cobType}`, q2 );

    const cobs = await this.fetcher.fetchJSON<Cobranca[]>( "GET", path );

    return cobs;
  }

  async getCob( txid: string ): Promise<Cobranca> {
    const path = buildFetchPath( `${this.cobType}/${txid}`, this.additionalQuery );

    const cob = await this.fetcher.fetchJSON<Cobranca>( "GET", path );

    return cob;
  }

  async putCob( txid: string = '', cobIn: Cobranca ): Promise<Cobranca> {
    const path = buildFetchPath( `${this.cobType}/${txid}`, this.additionalQuery );

    const cobOut = await this.fetcher.fetchJSON<Cobranca,Cobranca>( "PUT", path, cobIn, undefined, (status) => ( status == 201 ) );

    return cobOut;
  }

  async patchCob( txid: string, cobIn: PartialCobranca ): Promise<Cobranca> {
    const path = buildFetchPath( `${this.cobType}/${txid}`, this.additionalQuery);

    const cobOut = await this.fetcher.fetchJSON<PartialCobranca,Cobranca>( "PATCH", path, cobIn );

    return cobOut;
  }
}
