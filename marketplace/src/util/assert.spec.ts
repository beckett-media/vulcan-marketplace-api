const configuration = require('../config/configuration');
import { Group } from '../config/enum';
import { assertOwnerOrAdmin } from './assert';

describe('Authentication', () => {
  beforeEach(async () => {
    const configurationMock = jest.spyOn(configuration, 'default');
    configurationMock.mockImplementation(() => {
      return {
        test: { auth_enabled: true },
      };
    });
  });

  it('should be able to login', () => {
    const jwt = {
      user: 'user',
      groups: [Group.User],
    };
    assertOwnerOrAdmin(jwt, { user: 'user' }, console);
  });

  it('should allow admin', () => {
    const uuid = 'user';
    var jwt = {
      user: uuid,
      groups: [Group.Admin],
    };

    assertOwnerOrAdmin(jwt, { user: 'user' }, console);
  });

  it('should deny non-login access', () => {
    const uuid = 'user';
    var jwt = null;

    expect(() => {
      assertOwnerOrAdmin(jwt, { user: 'user' }, console);
    }).toThrow('No login admin/user found');

    jwt = undefined;
    expect(() => {
      assertOwnerOrAdmin(jwt, { user: 'user' }, console);
    }).toThrow('No login admin/user found');
  });

  it('should deny un-matched user access', () => {
    const uuid = 'user';
    var jwt = {
      user: 'user2',
      groups: [Group.User],
    };

    expect(() => {
      assertOwnerOrAdmin(jwt, { user: uuid }, console);
    }).toThrow('Access not allowed.');
  });
});
