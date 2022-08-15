import { Item } from 'src/database/database.entity';
import { generateNFTDescription } from './format';

describe('Format', () => {
  it('should format the correct NFT description', () => {
    const item = {
      type: 1,
      year: 1999,
      set_name: 'Topps',
      card_number: '123',
      player: 'Joe',
    };

    expect(generateNFTDescription(item as Item)).toEqual('1999 Topps 123 Joe');

    const item2 = {
      type: 1,
      year: 1999,
      card_number: '123',
      player: 'Joe',
    };

    expect(generateNFTDescription(item2 as Item)).toEqual('1999 123 Joe');

    const item3 = {
      type: 1,
    };

    expect(generateNFTDescription(item3 as Item)).toEqual('');

    const item4 = {
      type: 2,
      issue: '#2022-12',
      publisher: 'DC Comics',
    };

    expect(generateNFTDescription(item4 as Item)).toEqual('DC Comics #2022-12');

    const item5 = {
      type: 2,
    };

    expect(generateNFTDescription(item5 as Item)).toEqual('');
  });
});
