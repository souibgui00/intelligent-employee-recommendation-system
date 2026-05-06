import { NotificationsGateway } from './notifications.gateway';

describe('NotificationsGateway', () => {
  let gateway: NotificationsGateway;
  let emitMock: jest.Mock;
  let serverMock: any;

  beforeEach(() => {
    gateway = new NotificationsGateway();
    emitMock = jest.fn();
    serverMock = {
      to: jest.fn(() => ({ emit: emitMock })),
    };
    gateway.server = serverMock;
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const createClient = (id: string, userId?: string) => ({
    id,
    handshake: { query: { userId } },
  }) as any;

  it('tracks connections by user id', () => {
    gateway.handleConnection(createClient('socket-1', 'user-1'));

    expect((gateway as any).userSockets.get('user-1').has('socket-1')).toBe(true);
  });

  it('removes sockets on disconnect and clears empty users', () => {
    gateway.handleConnection(createClient('socket-1', 'user-1'));
    gateway.handleDisconnect(createClient('socket-1', 'user-1'));

    expect((gateway as any).userSockets.has('user-1')).toBe(false);
  });

  it('emits to all sockets for a user', () => {
    gateway.handleConnection(createClient('socket-1', 'user-1'));
    gateway.handleConnection(createClient('socket-2', 'user-1'));

    const result = gateway.emitToUser('user-1', 'newNotification', { id: 'n1' });

    expect(result).toBe(true);
    expect(serverMock.to).toHaveBeenCalledWith('socket-1');
    expect(serverMock.to).toHaveBeenCalledWith('socket-2');
    expect(emitMock).toHaveBeenCalledWith('newNotification', { id: 'n1' });
  });

  it('returns false when user is not connected', () => {
    const result = gateway.emitToUser('missing-user', 'newNotification', { id: 'n1' });

    expect(result).toBe(false);
    expect(serverMock.to).not.toHaveBeenCalled();
  });

  it('responds to ping with pong', () => {
    expect(gateway.handlePing({} as any, { hello: 'world' })).toEqual({
      event: 'pong',
      data: { hello: 'world' },
    });
  });
});